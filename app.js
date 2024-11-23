 $(document).ready(function () {
      let countries = [];
      let correctCount = 0;
      let displayedCountries = 0;
      const batchSize = 21; // Número de países a cargar por lote

      // Actualizar marcador
      const updateScore = () => {
        $('#correct').text(correctCount);
        $('#total').text(countries.length);
      };

      // Cargar países
      const loadCountries = () => {
        $.get('https://restcountries.com/v3.1/all', function (data) {
          countries = data.filter(c => c.translations.spa?.common);
          updateScore();
          displayFlags();
        }).fail(() => {
          $('#message').text('Error al cargar los datos.').addClass('text-red-500');
        });
      };

      // Mostrar banderas (por lotes)
      const displayFlags = () => {
        const container = $('#flags-container');

        for (let i = displayedCountries; i < displayedCountries + batchSize && i < countries.length; i++) {
          const country = countries[i];
          const countryName = country.translations.spa.common.toLowerCase();
          const flagHTML = `
            <div class="flex flex-col items-center space-y-3">
              <div class="flag-card w-full h-80 mb-10  hover:cursor-pointer" data-name="${countryName}">
                <img data-src="${country.flags.svg}" alt="${country.translations.spa.common}" class="w-full h-full lazy-flag">
                <div class="country-name hidden text-lg font-bold mt-2">${country.translations.spa.common}</div>
              </div>
              <div class="flex gap-2">
                <input type="text" class="flag-input w-full px-3 py-2 border rounded focus:outline-none text-center text-black font-bold" data-country="${countryName}">
                <button class="submit-guess bg-green-600 text-white px-2 py-1 rounded font-semibold">¿Acertaste?</button>
              </div>
            </div>
          `;
          container.append(flagHTML);
        }

        displayedCountries += batchSize;

        // Iniciar Lazy Loading para imágenes nuevas
        lazyLoadFlags();

        // Añadir eventos
        $('.flag-input').on('keydown', function (e) {
          if (e.key === 'Enter') handleGuess($(this));
        });
        // Agregar evento para enviar respuesta con el botón
        $('.submit-guess').on('click', function () {
          const input = $(this).prev('.flag-input'); // Obtener el campo de texto anterior
          handleGuess(input); // Llamar a la función para verificar la respuesta
        });

        $('.flag-card').on('click', function () {
          const card = $(this);
          const countryName = card.data('name');
          const input = card.closest('.flex').find('.flag-input'); // Cambié .next() por .closest().find()
          if (input.prop('disabled')) {
            const countryData = countries.find(c => c.translations.spa.common.toLowerCase() === countryName);
            showCountryModal(countryData);
          }
        });
      };

      // Verificar respuesta y mostrar modal si es correcta
      const handleGuess = (input) => {
        const userGuess = input.val().trim().toLowerCase();
        const correctAnswer = input.data('country');
        const selectedCard = $(`.flag-card[data-name="${correctAnswer}"]`);
        const countryNameElement = selectedCard.find('.country-name');
        console.log(correctAnswer)

        if (userGuess === correctAnswer) {
          input.prop('disabled', true).removeClass('bg-red-500').addClass('bg-green-500');
          countryNameElement.removeClass('hidden');
          correctCount++;
        } else {
          input.addClass('bg-red-500');
        }

        updateScore();
      };

      // Mostrar modal con información del país
      const showCountryModal = (country) => {
        // Actualizar la información en la modal
        $('#modal-country-name').text(country.translations.spa.common);
        $('#modal-country-capital').text(country.capital ? country.capital[0] : 'Desconocida');
        $('#modal-country-population').text(country.population.toLocaleString());
        $('#modal-country-area').text(country.area ? country.area.toLocaleString() : 'N/A');
    
        // Agregar solo el mapa de OpenStreetMap en un iframe con marcador y nombre
        const lat = country.latlng[0];  // Latitud
        const lon = country.latlng[1];  // Longitud
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.1}%2C${lat - 0.1}%2C${lon + 0.1}%2C${lat + 0.1}&layer=mapnik&marker=${lat}%2C${lon}`;
    
        $('#modal-country-maps').html(`
            <h6 class="font-semibold">Mapa de ${country.translations.spa.common}</h6>
            <iframe width="100%" height="300" frameborder="0" style="border:2px solid black;" 
                src="${mapUrl}" allowfullscreen>
            </iframe>
        `);
    
        // Mostrar la modal
        $('#countryModal').removeClass('hidden');
    };    
     
      // Cerrar modal
      $('#close-modal').on('click', () => {
        $('#countryModal').addClass('hidden');
      });

      // Lazy Loading de imágenes usando Intersection Observer
      const lazyLoadFlags = () => {
        const lazyFlags = document.querySelectorAll('.lazy-flag');
        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.getAttribute('data-src');
              img.classList.remove('lazy-flag');
              observer.unobserve(img);
            }
          });
        });

        lazyFlags.forEach(flag => observer.observe(flag));
      };

      // Detectar scroll para cargar más banderas
      $(window).on('scroll', () => {
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
          if (displayedCountries < countries.length) {
            displayFlags();
          }
        }
      });

      // Iniciar el juego
      loadCountries();
    });