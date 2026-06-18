use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

const HOST: &str = "127.0.0.1:8788";

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind(HOST)?;
    println!("Toly private Rust API listening on http://{}", HOST);

    for stream in listener.incoming() {
        match stream {
            Ok(mut stream) => handle_stream(&mut stream),
            Err(error) => eprintln!("connection error: {error}"),
        }
    }

    Ok(())
}

fn handle_stream(stream: &mut TcpStream) {
    let mut buffer = [0_u8; 16384];
    let read = match stream.read(&mut buffer) {
        Ok(size) => size,
        Err(_) => return,
    };

    let request = String::from_utf8_lossy(&buffer[..read]);
    let first_line = request.lines().next().unwrap_or("");

    if first_line.starts_with("OPTIONS ") {
        send(stream, 204, "application/json", "");
        return;
    }

    if first_line.starts_with("GET /api/posts ") {
        let body = fs::read_to_string(data_file()).unwrap_or_else(|_| "[]".to_string());
        send(stream, 200, "application/json", &body);
        return;
    }

    if first_line.starts_with("POST /api/posts ") {
        match request.split("\r\n\r\n").nth(1) {
            Some(payload) => match build_post(payload) {
                Ok(post) => {
                    let existing = fs::read_to_string(data_file()).unwrap_or_else(|_| "[]".to_string());
                    let merged = merge_post(&existing, &post);
                    if let Some(parent) = data_file().parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    match fs::write(data_file(), merged.as_bytes()) {
                        Ok(_) => send(stream, 201, "application/json", &format!("{{\"post\":{post}}}")),
                        Err(error) => send(stream, 500, "application/json", &json_error(&error.to_string())),
                    }
                }
                Err(error) => send(stream, 400, "application/json", &json_error(&error)),
            },
            None => send(stream, 400, "application/json", &json_error("missing request body")),
        }
        return;
    }

    send(stream, 404, "application/json", &json_error("not found"));
}

fn data_file() -> PathBuf {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if cwd.ends_with("backend/rust") || cwd.ends_with("backend\\rust") {
        return cwd
            .parent()
            .and_then(|path| path.parent())
            .unwrap_or(&cwd)
            .join("data")
            .join("news.json");
    }
    cwd.join("data").join("news.json")
}

fn build_post(payload: &str) -> Result<String, String> {
    let title = extract(payload, "title").ok_or("title is required")?;
    let summary = extract(payload, "summary").ok_or("summary is required")?;
    let category = extract(payload, "category").unwrap_or_else(|| "company".to_string());
    let body = extract(payload, "body").unwrap_or_default();
    let date = extract(payload, "date").unwrap_or_else(todayish);

    if !["company", "tools", "games", "studio"].contains(&category.as_str()) {
        return Err("category must be company, tools, games, or studio".to_string());
    }

    let id = format!("{}-{}", date, slugify(&title));
    Ok(format!(
        "{{\"id\":\"{}\",\"date\":\"{}\",\"category\":\"{}\",\"title\":\"{}\",\"summary\":\"{}\",\"body\":\"{}\"}}",
        escape(&id),
        escape(&date),
        escape(&category),
        escape(&title),
        escape(&summary),
        escape(&body)
    ))
}

fn extract(payload: &str, key: &str) -> Option<String> {
    let marker = format!("\"{}\"", key);
    let start = payload.find(&marker)?;
    let after_key = &payload[start + marker.len()..];
    let colon = after_key.find(':')?;
    let after_colon = after_key[colon + 1..].trim_start();
    if !after_colon.starts_with('"') {
        return None;
    }

    let mut value = String::new();
    let mut escaped = false;
    for ch in after_colon[1..].chars() {
        if escaped {
            value.push(match ch {
                'n' => '\n',
                'r' => '\r',
                't' => '\t',
                other => other,
            });
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == '"' {
            break;
        }
        value.push(ch);
    }

    Some(value.trim().to_string()).filter(|value| !value.is_empty())
}

fn merge_post(existing: &str, post: &str) -> String {
    let existing = existing.trim();
    if existing == "[]" || existing.is_empty() {
        return format!("[\n  {}\n]\n", post);
    }

    let inner = existing.trim_start_matches('[').trim_end_matches(']').trim();
    if inner.is_empty() {
        format!("[\n  {}\n]\n", post)
    } else {
        format!("[\n  {},\n{}\n]\n", post, inner)
    }
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;
    for ch in value.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch);
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }
    slug.trim_matches('-').to_string()
}

fn todayish() -> String {
    let days = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() / 86_400)
        .unwrap_or(0);
    format!("day-{days}")
}

fn escape(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
}

fn json_error(message: &str) -> String {
    format!("{{\"error\":\"{}\"}}", escape(message))
}

fn send(stream: &mut TcpStream, status: u16, content_type: &str, body: &str) {
    let reason = match status {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        400 => "Bad Request",
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "OK",
    };
    let response = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status,
        reason,
        content_type,
        body.as_bytes().len(),
        body
    );
    let _ = stream.write_all(response.as_bytes());
}
