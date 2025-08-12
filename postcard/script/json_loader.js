document.addEventListener("DOMContentLoaded", function() {
			document.title = jsonData.title;
			 
            // Используем jsonData из setings.js
            document.getElementById("event").innerText = jsonData.event;
            document.getElementById("recipientName").innerText = jsonData.recipientName;
            document.getElementById("senderName").innerText = jsonData.senderName;
            document.getElementById("personalMessage").innerText = jsonData.personalMessage;
			
			// Заполнение пожеланий
			const wishesContainer = document.getElementById("wishes");
			jsonData.wishes.forEach((wish) => {
				const wishElement = document.createElement('div'); // Создаём новый элемент для пожелания
				wishElement.innerText = wish; // Устанавливаем текст пожелания
				wishesContainer.appendChild(wishElement); // Добавляем элемент в контейнер
			});
					
            // Заполнение изображений слайдера
            const simSliderList = document.querySelector('.sim-slider-list');
			// Проверка длины массива изображений и создание нового массива, если длина больше 10
			const imagesToDisplay = jsonData.images.length > 10 ? jsonData.images.slice(0, 10) : jsonData.images;
            jsonData.images.forEach((image) => {
                const li = document.createElement('li');
				li.classList.add('sim-slider-element');
                const img = document.createElement('img');
                img.src = image;
                li.appendChild(img);
                simSliderList.appendChild(li);
            });

            // Установка QR-кода
            const qrCodeElement = document.getElementById('qr');
			if (jsonData.qrCode) {
				const qrImg = document.createElement('img');
				qrImg.src = jsonData.qrCode;
				qrCodeElement.appendChild(qrImg);
			}
			
			// Динамическое создание push-pins
			const pushPinsContainer = document.querySelector('.push-pins');
			if (jsonData.pushPins && jsonData.pushPins.length > 0) {
				const defaultClasses = ['price-left', 'price-right', 'price-lb', 'price-rb']; // Массив классов по умолчанию
				// Получаем только первые 4 пин-кода
				const limitedPushPins = jsonData.pushPins.slice(0, 4);
				
				limitedPushPins.forEach((pushPin, index) => {
					// Проверка, если объект pushPin пустой
					if (!pushPin || Object.keys(pushPin).length === 0) {
						return; // Пропустить текущую итерацию
					}
					
					const pinDiv = document.createElement('div');
					
					// Используем класс из pushPin, если он есть, иначе берем из массива классов по умолчанию
					const className = pushPin.class || defaultClasses[index] || 'default-class'; // Замените 'default-class' на ваш класс по умолчанию
					
					pinDiv.classList.add(className); // Добавление класса
					const img = document.createElement('img');
					img.src = pushPin.src;
					pinDiv.appendChild(img);
					pushPinsContainer.appendChild(pinDiv);
				});
			}
        });
