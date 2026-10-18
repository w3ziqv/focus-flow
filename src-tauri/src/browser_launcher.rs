//! Some desktop openers stay alive for the entire browser session.
//! Start accepting the OAuth callback without waiting for that session to end.
use std::{
    process::{Command, Stdio},
    time::{Duration, Instant},
};

pub(super) fn launch(command: &mut Command) -> bool {
    let Ok(mut child) = command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    else {
        return false;
    };
    let deadline = Instant::now() + Duration::from_millis(250);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => return status.success(),
            Ok(None) if Instant::now() < deadline => {
                std::thread::sleep(Duration::from_millis(10));
            }
            Ok(None) => {
                // Reap later, without blocking the loopback listener or logging
                // command arguments (which contain the OAuth URL).
                std::thread::spawn(move || {
                    let _ = child.wait();
                });
                return true;
            }
            Err(_) => {
                std::thread::spawn(move || {
                    let _ = child.wait();
                });
                return false;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn immediate_launcher_failure_allows_a_fallback() {
        assert!(!launch(Command::new("/bin/sh").args(["-c", "exit 7"])));
        assert!(launch(Command::new("/bin/sh").args(["-c", "exit 0"])));
        assert!(!launch(&mut Command::new("/no-such-focus-flow-browser")));
    }

    #[test]
    fn browser_waiting_for_callback_does_not_block_callback_processing() {
        let root = std::env::temp_dir().join(format!("ff-opener-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let release = root.join("callback-processed");
        let done = root.join("browser-exited");
        let _ = std::fs::remove_file(&release);
        let _ = std::fs::remove_file(&done);
        // A watchdog releases a broken blocking implementation so the test can
        // fail rather than hang indefinitely. No browser or real URL is used.
        let watchdog_release = release.clone();
        let watchdog = std::thread::spawn(move || {
            let deadline = Instant::now() + Duration::from_secs(3);
            while !watchdog_release.exists() && Instant::now() < deadline {
                std::thread::sleep(Duration::from_millis(10));
            }
            if !watchdog_release.exists() {
                std::fs::write(watchdog_release, b"watchdog").unwrap();
            }
        });
        let started = Instant::now();
        let opened = launch(Command::new("/bin/sh").args([
            "-c",
            "while [ ! -f \"$1\" ]; do sleep 0.02; done; : > \"$2\"",
            "test-browser",
            release.to_str().unwrap(),
            done.to_str().unwrap(),
        ]));
        let elapsed = started.elapsed();
        std::fs::write(&release, b"callback").unwrap();
        watchdog.join().unwrap();
        let deadline = Instant::now() + Duration::from_secs(2);
        while !done.exists() && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(10));
        }
        let exited = done.exists();
        let _ = std::fs::remove_dir_all(root);
        assert!(opened);
        assert!(elapsed < Duration::from_secs(2));
        assert!(exited);
    }
}
