// Файл интеграции конструктора с основной открыткой
// Этот файл загружает данные из конструктора и применяет их к открытке

class CardConstructor {
    constructor() {
        this.cardData = null;
        this.init();
    }
    
    init() {
        // Загружаем данные из localStorage или из файла setings.js
        this.loadCardData();
        this.applyCardData();
    }
    
    loadCardData() {
        // Сначала пытаемся загрузить из localStorage (данные из конструктора)
        const savedData = localStorage.getItem('cardData');
        if (savedData) {
            try {
                this.cardData = JSON.parse(savedData);
                console.log('Загружены данные из конструктора:', this.cardData);
                return;
            } catch (e) {
                console.error('Ошибка загрузки данных из localStorage:', e);
            }
        }
        
        // Если данных в localStorage нет, используем данные из setings.js
        if (typeof jsonData !== 'undefined') {
            this.cardData = jsonData;
            console.log('Загружены данные из setings.js:', this.cardData);
        } else {
            // Используем данные по умолчанию
            this.cardData = {
                title: "Поздравление",
                event: "День Рождения",
                recipientName: "Вадюша",
                wishes: ["Поздравляю с днем рождения!", "Желаю всего самого наилучшего!"],
                senderName: "Араик",
                personalMessage: "Я не опоздал - это ты рано родился",
                images: ["./img/1.jpg", "./img/2.jpg", "./img/3.jpg", "./img/4.jpg", "./img/5.jpg"],
                qrCode: "./img/qr.png",
                pushPins: [{}, {}, {}, {}]
            };
            console.log('Используются данные по умолчанию:', this.cardData);
        }
    }
    
    applyCardData() {
        if (!this.cardData) return;
        
        // Применяем заголовок события
        this.updateElement('event', this.cardData.event);
        
        // Применяем имя получателя
        this.updateElement('recipientName', this.cardData.recipientName);
        
        // Применяем пожелания
        this.updateWishes();
        
        // Применяем имя отправителя
        this.updateElement('senderName', this.cardData.senderName);
        
        // Применяем личное сообщение
        this.updateElement('personalMessage', this.cardData.personalMessage);
        
        // Применяем изображения для слайдера
        this.updateSlider();
        
        // Применяем QR-код
        this.updateQRCode();
        
        // Инициализируем слайдер
        this.initSlider();
    }
    
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '';
        }
    }
    
    updateWishes() {
        const wishesElement = document.getElementById('wishes');
        if (wishesElement && this.cardData.wishes) {
            if (Array.isArray(this.cardData.wishes)) {
                wishesElement.innerHTML = this.cardData.wishes.join('<br>');
            } else {
                wishesElement.textContent = this.cardData.wishes;
            }
        }
    }
    
    updateSlider() {
        const sliderList = document.querySelector('.sim-slider-list');
        if (!sliderList || !this.cardData.images) return;
        
        // Очищаем существующие изображения
        sliderList.innerHTML = '';
        
        // Добавляем новые изображения
        this.cardData.images.forEach((imageSrc, index) => {
            const li = document.createElement('li');
            li.className = 'sim-slider-element';
            li.style.opacity = index === 0 ? '1' : '0';
            
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `Изображение ${index + 1}`;
            
            li.appendChild(img);
            sliderList.appendChild(li);
        });
    }
    
    updateQRCode() {
        if (!this.cardData.qrCode) return;
        
        // Ищем контейнер для QR-кода
        const qrContainer = document.getElementById('qr');
        if (qrContainer) {
            // Создаем элемент QR-кода
            const qrElement = document.createElement('div');
            qrElement.className = 'qr-code__tabs__elem';
            qrElement.style.textAlign = 'center';
            
            const qrImage = document.createElement('img');
            qrImage.src = this.cardData.qrCode;
            qrImage.alt = 'QR-код';
            qrImage.style.maxWidth = '100px';
            qrImage.style.height = 'auto';
            
            qrElement.appendChild(qrImage);
            qrContainer.appendChild(qrElement);
        }
    }
    
    initSlider() {
        // Инициализируем слайдер после обновления изображений
        setTimeout(() => {
            if (typeof Sim !== 'undefined') {
                new Sim('.sim-slider');
            }
        }, 100);
    }
    
    // Метод для обновления данных в реальном времени
    updateFromConstructor(newData) {
        this.cardData = newData;
        this.applyCardData();
    }
}

// Создаем глобальный экземпляр конструктора
window.cardConstructor = new CardConstructor();

// Функция для обновления данных из конструктора
function updateCardFromConstructor() {
    const savedData = localStorage.getItem('cardData');
    if (savedData) {
        try {
            const newData = JSON.parse(savedData);
            window.cardConstructor.updateFromConstructor(newData);
        } catch (e) {
            console.error('Ошибка обновления данных из конструктора:', e);
        }
    }
}

// Слушаем изменения в localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'cardData') {
        updateCardFromConstructor();
    }
});

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardConstructor;
}
