const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let image = new Image();
let currentHeight = 50;
let currentRotation = 0;
let dragging = false;
let offsetX, offsetY;
let textX = canvas.width / 2;
let textY = canvas.height / 2;
let isLighted = false;
let color = '#ffffff'; // Белый цвет по умолчанию
let imageHeightPercentage = 100; // Высота изображения в процентах

image.src = 'https://via.placeholder.com/800'; // Загружаем изображение по умолчанию
image.onload = drawText;
image.onerror = function() {
    console.error('Ошибка загрузки изображения');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inputText').addEventListener('input', drawText);
    document.getElementById('fontSelector').addEventListener('change', drawText);
    document.getElementById('colorPicker').addEventListener('change', function() {
        color = this.value;
        drawText();
    });
    document.getElementById('materialSelector').addEventListener('change', drawText);
    document.getElementById('baseCheckbox').addEventListener('change', drawText);
    document.getElementById('sizeSlider').addEventListener('input', function() {
        currentHeight = parseInt(this.value);
        document.getElementById('sizeDisplay').textContent = `${currentHeight} см`;
        drawText();
    });
    document.getElementById('rotateSlider').addEventListener('input', function() {
        currentRotation = parseInt(this.value);
        document.getElementById('rotateDisplay').textContent = `${currentRotation}°`;
        drawText();
    });
    document.getElementById('lightToggle').addEventListener('click', function() {
        isLighted = !isLighted;
        this.classList.toggle('active');
        document.getElementById('toggleText').textContent = isLighted ? 'ON' : 'OFF';
        drawText();
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            image.src = e.target.result;
            document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" alt="Загруженное изображение">`;
            image.onload = function() {
                drawText();
            };
            image.onerror = function() {
                console.error('Ошибка загрузки изображения');
            };
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('imageHeight').addEventListener('input', function() {
        imageHeightPercentage = parseInt(this.value);
        drawText();
    });

    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('touchmove', drag);
    canvas.addEventListener('touchend', endDrag);

    window.addEventListener('resize', resizeCanvas);

    function resizeCanvas() {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = canvas.width;
        drawText();
    }

    resizeCanvas();
});

function startDrag(e) {
    e.preventDefault();
    dragging = true;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    const rect = canvas.getBoundingClientRect();
    offsetX = clientX - rect.left - textX;
    offsetY = clientY - rect.top - textY;
}

function drag(e) {
    if (dragging) {
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const rect = canvas.getBoundingClientRect();
        textX = clientX - rect.left - offsetX;
        textY = clientY - rect.top - offsetY;
        drawText();
    }
}

function endDrag() {
    dragging = false;
}

function cropAndResizeImage(image) {
    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = image.width / image.height;
    let sx, sy, sWidth, sHeight;

    if (canvasAspect > imageAspect) {
        sHeight = image.height;
        sWidth = image.height * canvasAspect;
        sx = (image.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = image.width;
        sHeight = image.width / canvasAspect;
        sx = 0;
        sy = (image.height - sHeight) / 2;
    }

    const newHeight = canvas.height * (imageHeightPercentage / 100);
    const yOffset = (canvas.height - newHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, yOffset, canvas.width, newHeight);
}

function drawText() {
    const text = document.getElementById('inputText').value;
    const font = document.getElementById('fontSelector').value;
    const baseIncluded = document.getElementById('baseCheckbox').checked;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Проверяем, что изображение загружено
    if (image.complete && image.naturalWidth !== 0) {
        cropAndResizeImage(image);
        if (isLighted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Темный фильтр
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate((currentRotation * Math.PI) / 180);
    ctx.font = `${currentHeight}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';

    if (baseIncluded) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Подложка
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(-textWidth / 2 - 10, -currentHeight / 2 - 10, textWidth + 20, currentHeight + 20);
        ctx.fillStyle = color;
    }

    if (isLighted) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
    } else {
        ctx.shadowBlur = 0;
    }

    ctx.fillText(text, 0, 0);
    ctx.restore();

    const letterWidthCm = (currentHeight / 50) * 36; // Пропорции: высота 50 см - ширина 36 см
    const textWidthCm = (letterWidthCm * text.length).toFixed(2);

    // Обновляем показатели размера
    updateDimensions(textX, textY, currentHeight, textWidthCm);

    document.getElementById('sizeIndicator').textContent = `Размер: ${currentHeight} см x ${textWidthCm} см`;

    calculateCost(text, currentHeight, baseIncluded);
}

function updateDimensions(x, y, height, width) {
    document.getElementById('heightIndicator').textContent = `${height} см`;
    document.getElementById('widthIndicator').textContent = `${width} см`;

    const heightIndicator = document.getElementById('heightIndicator');
    const widthIndicator = document.getElementById('widthIndicator');

    heightIndicator.style.top = `${y - height / 2}px`;
    heightIndicator.style.right = `${canvas.width - x}px`;

    widthIndicator.style.top = `${y + height / 2 + 20}px`;
    widthIndicator.style.left = `${x - width / 2}px`;
}

function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth) {
    const headlen = 10; // длина головки стрелки
    const angle = Math.atan2(toy - fromy, tox - fromx);

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function getBrighterColor(hexColor) {
    const color = hexColor.substring(1);
    const rgb = parseInt(color, 16);
    const r = Math.min(255, (rgb >> 16) + 50);
    const g = Math.min(255, ((rgb >> 8) & 0x00FF) + 50);
    const b = Math.min(255, (rgb & 0x0000FF) + 50);
    return `rgb(${r}, ${g}, ${b})`;
}

function calculateCost(text, height, baseIncluded) {
    const baseCost = 7000;
    const baseAdditionalCost = 50000;
    let totalCost = text.length * height * baseCost;

    if (baseIncluded) {
        totalCost += text.length * baseAdditionalCost;
    }

    document.getElementById('output').textContent = `Стоимость: ${totalCost} сум`;
}
