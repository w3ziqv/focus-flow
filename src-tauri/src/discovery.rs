use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use std::{
    collections::BTreeMap,
    net::UdpSocket,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
};
use tauri::Emitter;
const SERVICE: &str = "_focusflow._udp.local.";
#[derive(Default)]
pub struct Discovery {
    daemon: Mutex<Option<ServiceDaemon>>,
    socket: Mutex<Option<UdpSocket>>,
    generation: Arc<AtomicU64>,
}
#[derive(Clone, Serialize)]
pub struct Peer {
    id: String,
    name: String,
}
impl Discovery {
    pub fn stop(&self) {
        self.generation.fetch_add(1, Ordering::SeqCst);
        if let Some(daemon) = self.daemon.lock().unwrap().take() {
            let _ = daemon.shutdown();
        }
        self.socket.lock().unwrap().take();
    }
    pub fn start(&self, app: tauri::AppHandle, device: String, name: String) -> Result<(), String> {
        if device.len() > 64
            || device.len() < 8
            || !device
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        {
            return Err("Invalid device identity".into());
        }
        self.stop();
        let daemon = ServiceDaemon::new().map_err(|e| e.to_string())?;
        let receiver = daemon.browse(SERVICE).map_err(|e| e.to_string())?;
        let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
        let port = socket.local_addr().map_err(|e| e.to_string())?.port();
        let hostname = format!("ff-{}.local.", &device[..device.len().min(40)]);
        let display_name: String = name.chars().filter(|c| !c.is_control()).take(80).collect();
        let properties = [
            ("name", display_name.as_str()),
            ("pairing", "manual-webrtc"),
            ("schema", "3"),
        ];
        let service = ServiceInfo::new(SERVICE, &device, &hostname, "", port, &properties[..])
            .map_err(|e| e.to_string())?
            .enable_addr_auto();
        let own = service.get_fullname().to_string();
        daemon.register(service).map_err(|e| e.to_string())?;
        *self.daemon.lock().unwrap() = Some(daemon);
        *self.socket.lock().unwrap() = Some(socket);
        let generation = self.generation.clone();
        let started = generation.load(Ordering::SeqCst);
        std::thread::spawn(move || {
            let mut peers = BTreeMap::<String, Peer>::new();
            loop {
                if generation.load(Ordering::SeqCst) != started {
                    break;
                }
                let event = match receiver.recv_timeout(std::time::Duration::from_secs(1)) {
                    Ok(event) => event,
                    Err(_) => {
                        if receiver.is_disconnected() {
                            break;
                        } else {
                            continue;
                        }
                    }
                };
                match event {
                    ServiceEvent::ServiceResolved(info)
                        if info.get_fullname() != own && peers.len() < 64 =>
                    {
                        if info.get_property_val_str("schema") != Some("3") {
                            continue;
                        }
                        let name = info
                            .get_property_val_str("name")
                            .unwrap_or("Focus Flow")
                            .chars()
                            .take(80)
                            .collect();
                        peers.insert(
                            info.get_fullname().to_string(),
                            Peer {
                                id: info.get_fullname().to_string(),
                                name,
                            },
                        );
                    }
                    ServiceEvent::ServiceRemoved(_, full) => {
                        peers.remove(&full);
                    }
                    _ => continue,
                }
                let _ = app.emit_to(
                    "main",
                    "local-peers",
                    peers.values().cloned().collect::<Vec<_>>(),
                );
            }
        });
        Ok(())
    }
}
