const chalk = require('chalk');

// Hàm chuyển đổi mã hex sang RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Hàm nội suy màu giữa hai màu
function interpolateColor(color1, color2, factor) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return '#000000';

    const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
    const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
    const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// Hàm tạo gradient cho một đoạn text, đảm bảo không có màu trùng lặp liền kề
function createGradientText(text, colors) {
    const chars = text.split('');
    let result = '';
    const totalColors = colors.length;
    const charsPerSection = Math.ceil(chars.length / (totalColors - 1));
    let lastColor = null;

    chars.forEach((char, i) => {
        const section = Math.floor(i / charsPerSection);
        const colorIndex = Math.min(section, totalColors - 2);
        let factor = (i % charsPerSection) / charsPerSection;
        let currentColor = interpolateColor(
            colors[colorIndex],
            colors[colorIndex + 1],
            factor
        );

        // Đảm bảo màu hiện tại không trùng với màu trước đó
        if (currentColor === lastColor) {
            // Điều chỉnh factor một chút để tạo màu khác biệt
            factor = Math.min(1, factor + 0.05); // Thử tăng factor
            currentColor = interpolateColor(
                colors[colorIndex],
                colors[colorIndex + 1],
                factor
            );
            // Nếu vẫn trùng, thử giảm factor
            if (currentColor === lastColor) {
                factor = Math.max(0, factor - 0.1);
                currentColor = interpolateColor(
                    colors[colorIndex],
                    colors[colorIndex + 1],
                    factor
                );
            }
        }

        result += chalk.hex(currentColor)(char);
        lastColor = currentColor;
    });

    return result;
}

// Hàm tạo hiệu ứng gradient ngẫu nhiên cho prefix, đảm bảo không có màu trùng lặp liền kề
function createRandomPrefixGradient(text) {
    const numColors = Math.floor(Math.random() * 3) + 2; // Chọn ngẫu nhiên 2 hoặc 3 màu
    const prefixColors = [];
    for (let i = 0; i < numColors; i++) {
        // Tạo màu hex ngẫu nhiên
        prefixColors.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    }
    const chars = text.split('');
    let result = '';
    const totalColors = prefixColors.length;
    const charsPerSection = Math.ceil(chars.length / (totalColors - 1));
    let lastColor = null;

    chars.forEach((char, i) => {
        const section = Math.floor(i / charsPerSection);
        const colorIndex = Math.min(section, totalColors - 2);
        let factor = (i % charsPerSection) / charsPerSection;
        let currentColor = interpolateColor(
            prefixColors[colorIndex],
            prefixColors[colorIndex + 1],
            factor
        );

        // Đảm bảo màu hiện tại không trùng với màu trước đó
        if (currentColor === lastColor) {
            // Điều chỉnh factor một chút để tạo màu khác biệt
            factor = Math.min(1, factor + 0.05); // Thử tăng factor
            currentColor = interpolateColor(
                prefixColors[colorIndex],
                prefixColors[colorIndex + 1],
                factor
            );
            // Nếu vẫn trùng, thử giảm factor
            if (currentColor === lastColor) {
                factor = Math.max(0, factor - 0.1);
                currentColor = interpolateColor(
                    prefixColors[colorIndex],
                    prefixColors[colorIndex + 1],
                    factor
                );
            }
        }

        result += chalk.bold.hex(currentColor)(char);
        lastColor = currentColor;
    });
    return result;
}

// Mảng các tổ hợp màu gradient đẹp mắt
const beautifulGradients = [
    ['#FF6E7F', '#BFE9F3'], // Hồng nhạt - Xanh nhạt
    ['#A18CD1', '#FBC2EB'], // Tím nhạt - Hồng phấn
    ['#84FAB0', '#8FD3F4'], // Xanh lá nhạt - Xanh dương nhạt
    ['#FAD961', '#F76B1C'], // Vàng cam - Cam đậm
    ['#E0C3FC', '#8EC5FC'], // Tím nhạt - Xanh dương nhạt
    ['#F09819', '#EDDE5D'], // Cam - Vàng tươi
    ['#00C6FF', '#007BA7'], // Xanh dương sáng - Xanh dương đậm
    ['#D4FC79', '#96E6A1'], // Xanh lá tươi - Xanh lá nhạt
    ['#FF9A8B', '#FF6A88', '#FF6FAF'], // Hồng - Đỏ hồng - Hồng đậm
    ['#4776E6', '#8E54E9'], // Xanh dương - Tím
];

// Hàm chọn ngẫu nhiên một gradient đẹp mắt
function getRandomBeautifulGradient() {
    const randomIndex = Math.floor(Math.random() * beautifulGradients.length);
    return beautifulGradients[randomIndex];
}

// Main export
module.exports = (data, option) => {
    const randomGradient = getRandomBeautifulGradient();
    const gradientData = createGradientText(data, randomGradient);
    switch (option) {
        case "warn":
            console.log(createRandomPrefixGradient('[ Warning ] → ') + gradientData);
            break;
        case "error":
            console.log(createRandomPrefixGradient('[ Error ] → ') + gradientData);
            break;
        default:
            console.log(createRandomPrefixGradient(`${option} → `) + gradientData);
            break;
    }
}

// Loader export
module.exports.loader = (data, option) => {
    const randomGradient = getRandomBeautifulGradient();
    const gradientData = createGradientText(data, randomGradient);
    switch (option) {
        case "warn":
            console.log(createRandomPrefixGradient('[ Warning ] ') + gradientData);
            break;
        case "error":
            console.log(createRandomPrefixGradient('[ Error ] ') + gradientData);
            break;
        default:
            // Sử dụng một gradient mặc định đẹp mắt cho loader
            const loaderGradient = ['#00FFFF', '#007BFF', '#1E90FF'];
            console.log(createRandomPrefixGradient('[ Yaneka ] ') + createGradientText(data, loaderGradient));
            break;
    }
}