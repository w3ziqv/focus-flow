//! Keep AppImage libraries in Focus Flow, not in the system browser it launches.
use std::{ffi::OsString, path::Path, process::Command};

pub(super) fn prepare(
    command: &mut Command,
    appdir: Option<&Path>,
    environment: impl IntoIterator<Item = (OsString, OsString)>,
) {
    let Some(appdir) = appdir.filter(|path| path.is_absolute()) else {
        return;
    };
    for (key, value) in environment {
        let paths = matches!(
            key.to_str(),
            Some(
                "LD_LIBRARY_PATH"
                    | "PATH"
                    | "GIO_EXTRA_MODULES"
                    | "GTK_PATH"
                    | "XDG_DATA_DIRS"
                    | "QT_PLUGIN_PATH"
                    | "QML2_IMPORT_PATH"
                    | "GST_PLUGIN_PATH"
                    | "GST_PLUGIN_PATH_1_0"
                    | "GST_PLUGIN_SYSTEM_PATH"
                    | "GST_PLUGIN_SYSTEM_PATH_1_0"
            )
        );
        if paths {
            // Path-component matching keeps similarly named host directories.
            let kept: Vec<_> = std::env::split_paths(&value)
                .filter(|path| !path.starts_with(appdir))
                .collect();
            if kept.is_empty() {
                command.env_remove(key);
            } else if let Ok(value) = std::env::join_paths(kept) {
                command.env(key, value);
            }
        } else if matches!(
            key.to_str(),
            Some(
                "GIO_MODULE_DIR"
                    | "GTK_DATA_PREFIX"
                    | "GTK_EXE_PREFIX"
                    | "GSETTINGS_SCHEMA_DIR"
                    | "GTK_IM_MODULE_FILE"
                    | "GDK_PIXBUF_MODULE_FILE"
                    | "GDK_PIXBUF_MODULEDIR"
                    | "GST_PLUGIN_SCANNER"
                    | "GST_PLUGIN_SCANNER_1_0"
            )
        ) && Path::new(&value).starts_with(appdir)
        {
            command.env_remove(key);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn browser_child_uses_host_libraries_and_preserves_url_and_session() {
        // A harmless child replaces the browser; no OAuth code/token is used.
        let mut child = Command::new("/bin/sh");
        child.args([
            "-c",
            "printf '%s\\n' \"$LD_LIBRARY_PATH\" \"${GIO_MODULE_DIR-unset}\" \"$PATH\" \"$DBUS_SESSION_BUS_ADDRESS\" \"$XDG_CONFIG_HOME\" \"$1\"",
            "browser-test",
            "https://accounts.google.com/o/oauth2/v2/auth?state=test&code_challenge=test",
        ]);
        let variables = [
            ("LD_LIBRARY_PATH", "/tmp/App Image/usr/lib:/opt/host/lib"),
            ("GIO_MODULE_DIR", "/tmp/App Image/usr/lib/gio/modules"),
            (
                "PATH",
                "/tmp/App Image/usr/bin:/usr/bin:/tmp/App Image-host/bin",
            ),
            ("DBUS_SESSION_BUS_ADDRESS", "unix:path=/run/user/1000/bus"),
            ("XDG_CONFIG_HOME", "/tmp/test-profile/config"),
        ];
        child.envs(variables);
        prepare(
            &mut child,
            Some(Path::new("/tmp/App Image")),
            variables.map(|(key, value)| (key.into(), value.into())),
        );
        let result = child.output().unwrap();
        assert!(result.status.success());
        assert_eq!(
            String::from_utf8(result.stdout).unwrap(),
            concat!(
                "/opt/host/lib\nunset\n/usr/bin:/tmp/App Image-host/bin\n",
                "unix:path=/run/user/1000/bus\n/tmp/test-profile/config\n",
                "https://accounts.google.com/o/oauth2/v2/auth?state=test&code_challenge=test\n"
            )
        );
    }

    #[test]
    fn packaged_only_search_paths_are_unset_without_changing_host_environment() {
        let original = std::env::var_os("LD_LIBRARY_PATH");
        let mut child = Command::new("/bin/sh");
        child.args(["-c", "printf '%s' \"${LD_LIBRARY_PATH-unset}\""]);
        child.env("LD_LIBRARY_PATH", "/tmp/app/usr/lib");
        prepare(
            &mut child,
            Some(Path::new("/tmp/app")),
            [("LD_LIBRARY_PATH".into(), "/tmp/app/usr/lib".into())],
        );
        assert_eq!(child.output().unwrap().stdout, b"unset");
        assert_eq!(std::env::var_os("LD_LIBRARY_PATH"), original);
    }

    #[test]
    fn ordinary_installations_do_not_change_the_browser_environment() {
        for appdir in [None, Some(Path::new("relative/app"))] {
            let mut child = Command::new("unused");
            prepare(
                &mut child,
                appdir,
                [("LD_LIBRARY_PATH".into(), "/opt/host/lib".into())],
            );
            assert_eq!(child.get_envs().count(), 0);
        }
    }
}
