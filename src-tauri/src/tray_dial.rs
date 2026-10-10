use resvg::{tiny_skia, usvg};

pub fn render(
    minutes: u32,
    progress: f64,
    running: bool,
    focus: bool,
    size: u32,
) -> Result<Vec<u8>, String> {
    let color = if !running {
        "#716f66"
    } else if focus {
        "#c96442"
    } else {
        "#6e7f5c"
    };
    let circumference = 2.0 * std::f64::consts::PI * 19.0;
    let mut digits = String::new();
    const GLYPHS: [&str; 10] = [
        "111101101101111",
        "010110010010111",
        "111001111100111",
        "111001111001111",
        "101101111001001",
        "111100111001111",
        "111100111101111",
        "111001001001001",
        "111101111101111",
        "111101111001111",
    ];
    let text = minutes.min(99).to_string();
    let start = if text.len() == 1 { 18 } else { 13 };
    for (digit, ch) in text.chars().enumerate() {
        for (pixel, bit) in GLYPHS[ch.to_digit(10).unwrap() as usize]
            .chars()
            .enumerate()
        {
            if bit == '1' {
                digits.push_str(&format!(
                    "<rect x='{}' y='{}' width='2.5' height='2.5'/>",
                    start as f64 + digit as f64 * 10.0 + (pixel % 3) as f64 * 3.0,
                    14.0 + (pixel / 3) as f64 * 3.0
                ));
            }
        }
    }
    let svg = format!("<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><circle cx='22' cy='22' r='19' stroke='#716f66' stroke-width='1.5' fill='none'/><circle cx='22' cy='22' r='19' stroke='{color}' stroke-width='3' fill='none' stroke-dasharray='{} {circumference}' transform='rotate(-90 22 22)'/><g fill='{color}'>{digits}</g></svg>", progress.clamp(0.0, 1.0) * circumference);
    let tree = usvg::Tree::from_str(&svg, &usvg::Options::default()).map_err(|e| e.to_string())?;
    let mut pixmap = tiny_skia::Pixmap::new(size, size).ok_or("Invalid tray size")?;
    resvg::render(
        &tree,
        tiny_skia::Transform::from_scale(size as f32 / 44.0, size as f32 / 44.0),
        &mut pixmap.as_mut(),
    );
    // tiny-skia produces premultiplied RGBA; native tray image needs straight RGBA.
    let mut bytes = pixmap.data().to_vec();
    for rgba in bytes.as_chunks_mut::<4>().0 {
        let alpha = rgba[3] as u32;
        for c in &mut rgba[..3] {
            *c = (*c as u32 * 255 + alpha / 2)
                .checked_div(alpha)
                .unwrap_or(0)
                .min(255) as u8;
        }
    }
    Ok(bytes)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rasterizes_all_os_sizes_without_fonts() {
        for size in [16, 22, 24, 32, 44] {
            let bytes = render(25, 0.5, true, true, size).unwrap();
            assert_eq!(bytes.len(), (size * size * 4) as usize);
            assert!(bytes.as_chunks::<4>().0.iter().any(|p| p[3] > 0));
        }
    }
}
