document.addEventListener('DOMContentLoaded', () => {

  const createParams = (lat, lon) => {
    return {
      lat: lat,
      lon: lon,
      units: 'metric',
      lang: 'ru',
      appid: '2e3f0a4de66d0bcd26974266f439e301'
    };
  };

  const baseURL = 'https://api.openweathermap.org/data';

  const showError = (status, text) => {
    Toastify({
      text: `HTTP Error: status: ${status}, ${text}`,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'center',
      style: {
        background: '#ec6335',
        color: 'white',
      }
    }).showToast();
  };

  const showWarning = (text) => {
    Toastify({
      text: `${text}`,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'center',
      style: {
        background: '#FFB300',
        color: 'white',
      }
    }).showToast();
  };

  const currentDate = new Date();
  let getDay = time => new Date(time);

  const monthsRus = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  // const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

  // const monthsEng = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  // const dayRus = ['Вск', 'Пнд', 'Втр', 'Сре', 'Чтв', 'Птн', 'Суб'];
  // const dayRussian = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  // const dayEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  // const dayEng = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // const dayEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  (function () {
    let lat = 50.4497115;
    let lon = 30.5235707;
    navigator.geolocation.getCurrentPosition(function (geoPosition) {
        let lat = geoPosition ? geoPosition.coords.latitude : 50.4497115;
        let lon = geoPosition ? geoPosition.coords.longitude : 30.5235707;
        getPosition(lat, lon);
      },
      function (error) {
        console.log(error);
        getPosition(lat, lon);
      }
    );
  })();

  function timestampConversation(t) {
    const now = getDay(t * 1000);
    let hour = now.getHours();
    let minute = now.getMinutes();
    hour = (hour < 10) ? `0${hour}` : hour;
    minute = (minute < 10) ? `0${minute}` : minute;
    return `${hour}:${minute}`
  }

  let windDeg = (deg) => {
    if ((deg >= 0 && deg <= 22.5) || (deg >= 337.5 && deg <= 360)) return 'северный'
    else if (deg >= 22.6 || deg <= 67.5) return 'северо-восточный'
    else if (deg >= 67.6 || deg <= 112.5) return 'восточный'
    else if (deg >= 112.6 || deg <= 157.5) return 'юго-восточный'
    else if (deg >= 157.6 || deg <= 202.5) return 'южный'
    else if (deg >= 202.6 || deg <= 277.5) return 'юго-западный'
    else if (deg >= 277.6 || deg <= 282.5) return 'западный'
  }

  function getFullDay() {
    let dd = String(currentDate.getDate()).padStart(2, '0');
    let mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function getDuration(sunrise, sunset) {
    const sunRise = getDay(sunrise).getTime();
    const sunSet = getDay(sunset).getTime();
    const different = sunSet - sunRise;
    let hours = Math.floor((different % 86400) / 3600)
    let minutes = Math.ceil(((different % 86400) % 3600) / 60);
    if (minutes === 60) minutes -= 1;
    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    return `${hours} ч ${minutes} мин`;
  }

  async function getPosition(lat, lon) {
    await getCurrentWeather(lat, lon);
    await getForecastWeather(lat, lon);
    await getOneCallAPI(lat, lon);
    await initMap(lat, lon);
    hidePreloader();
  }

  function showPreloader() {
    const spinner = document.querySelector('.preloader.hide');
    const cont = document.querySelector('.container');
    if (spinner) spinner.classList.remove('hide');
    cont.classList.add('hide');
  }

  function hidePreloader() {
    const spinner = document.querySelector('.preloader');
    const cont = document.querySelector('.container.hide');
    setTimeout(() => {
      spinner.classList.add('hide');
      if (cont) cont.classList.remove('hide');
    }, 1000);
  }

  async function initMap(lat, lon) {
    const center = {lat: lat, lng: lon};

    const [{Map}, {AdvancedMarkerElement}, {PlaceAutocompleteElement}] = await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('marker'),
      google.maps.importLibrary('places')
    ]);

    const map = await new Map(document.getElementById('map'), {
      zoom: 10,
      center: center,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      mapId: 'map',
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
    });

    const marker = await new AdvancedMarkerElement({
      map,
      position: center
    });

    const locationButton = document.createElement('button');
    locationButton.textContent = 'Ваше местоположение';
    locationButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
    locationButton.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            getPosition(pos.lat, pos.lng)
            map.setCenter(pos);
            marker.position = pos;
          },
          () => {
            showWarning('Ошибка: В вашем браузере отключена геолокация');
          }
        );
      } else {
        showWarning('Ошибка: Ваш браузер не поддерживает службу геолокации');
      }
    });

    const placeAutocomplete = await new PlaceAutocompleteElement();
    placeAutocomplete.id = 'place-autocomplete-input';
    placeAutocomplete.style.colorScheme = 'none';
    const wrap = document.getElementById('search');
    const gmpPlaceAutocomplete = document.getElementById('place-autocomplete-input');

    if (!gmpPlaceAutocomplete) {
      wrap.appendChild(placeAutocomplete);
    }

    placeAutocomplete.addEventListener('gmp-select', async ({placePrediction}) => {
      showPreloader();
      const place = placePrediction.toPlace();
      await place.fetchFields({fields: ['location']});
      // If the place has a geometry, then present it on a map.
      if (place.viewport) {
        map.fitBounds(place.viewport);
      } else {
        map.setCenter(place.location);
      }
      marker.position = place.location;
      const lat = place.location.lat();
      const lon = place.location.lng();
      void getCity(lat, lon);
    });
  }

  async function getCity(lat, lon) {
    const params = new URLSearchParams(createParams(lat, lon));
    const url = `${baseURL}/2.5/weather?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        showError(response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status}, ${response.statusText}`);
      }

      const currentWeather = await response.json();

      currentWeather.name = await getPlace(lat, lon);

      renderCurrentWeather(currentWeather);
      void getForecastWeather(lat, lon);
      void getOneCallAPI(lat, lon);
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    } finally {
      hidePreloader();
    }
  }

  async function getPlace(lat, lon) {
    const params = new URLSearchParams({
      latlng: `${lat},${lon}`,
      language: 'ru',
      key: 'AIzaSyBP6TTt_WvIbUp5gx0n5niy6wyC175FUhs'
    });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}, ${response.statusText}`);
      }

      const place = await response.json();

      const component = place.results[0].address_components.find((component) =>
        component.types.includes("locality")
      );

      return component.long_name
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
  }

  async function getCurrentWeather(lat, lon) {
    const params = new URLSearchParams(createParams(lat, lon));
    const url = `${baseURL}/2.5/weather?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        showError(response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status}, ${response.statusText}`);
      }

      const currentWeather = await response.json();

      currentWeather.name = await getPlace(lat, lon);

      renderCurrentWeather(currentWeather);
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
  }

  function renderCurrentWeather({weather, main, visibility, name, sys}) {
    function createIcon() {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = `https://openweathermap.org/img/wn/${weather[0]['icon']}.png`;
      document.head.append(link);
    }

    createIcon();
    document.querySelector('.cityName h2').textContent = `${name} Сейчас`;

    document.getElementById('rightNow-weather').innerHTML = (`
          <div class='col-md-8 current-weather-wrapp row'>
            <div class='col-4 current-weather-description row'>
              <div class='icon'><img src='https://openweathermap.org/img/wn/${weather[0]['icon']}@2x.png' alt='icon'/></div>
              <span class='description'>${weather[0]['description']}</span>
            </div>
            <div class='col-8 current-weather-temperature row'>
              <span class='temperature'>${Math.round(main['temp'])}&deg;C</span>
              <span class='feel'>Ощущается как ${Math.round(main['feels_like'])}&deg;C</span>
            </div>
          </div>
          <div class='col-md-4 current-weather-duration row'>
              <span class='sunrise'>Восход: ${timestampConversation(sys['sunrise'])}</span>
              <span class='sunset'>Закат: ${timestampConversation(sys['sunset'])}</span>
              <span class='duration'>Продолжительность дня: ${getDuration(sys['sunrise'], sys['sunset'])}</span>
              <span class='visibility'>Видимость: ${(visibility / 1000)}км</span>
          </div>`)

    document.querySelector('#current-weather .date').textContent = (`${getFullDay()}`);
  }

  async function getForecastWeather(lat, lon) {
    const params = new URLSearchParams(createParams(lat, lon));
    const url = `${baseURL}/2.5/forecast?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        showError(response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status}, ${response.statusText}`);
      }

      const forecastWeather = await response.json();
      renderForecastWeather(forecastWeather);
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
  }

  function renderForecastWeather({list}) {

    for (let i = 1; i <= 5; i++) {
      document.querySelector(`section.day${i} .hourly-today-hour`).innerHTML = '<th class="today"></th>';
      document.querySelector(`section.day${i} .hourly-today-icon`).innerHTML = '<th></th>';
      document.querySelector(`section.day${i} .hourly-today-description`).innerHTML = '<th>Прогноз</th>';
      document.querySelector(`section.day${i} .hourly-today-temp`).innerHTML = '<th>Температура (&deg;C)</th>';
      document.querySelector(`section.day${i} .hourly-today-feel`).innerHTML = '<th>Ощущается (&deg;C)</th>';
      document.querySelector(`section.day${i} .hourly-today-wind`).innerHTML = '<th>Ветер (м/с)</th>';
      document.querySelector(`section.day${i} .hourly-today-degrees`).innerHTML = '<th>Направление</th>';
      document.querySelector(`section.day${i} .hourly-today-wind_gust`).innerHTML = '<th>Порывы (м/с)</th>';
      document.querySelector(`section.day${i} .hourly-today-humidity`).innerHTML = '<th>Влажность</th>';
      document.querySelector(`section.day${i} .hourly-today-pressure`).innerHTML = '<th>Давление (mmHg)</th>';
      document.querySelector(`section.day${i} .hourly-today-visibility`).innerHTML = '<th>Видимость (км)</th>';
    }

    const trunc = (t) => Math.trunc(t / 1000);
    const endToday = currentDate.setHours(23, 0, 0);
    const MS_IN_DAY = 86400000; // 24 часа
    const MS_IN_3_HOURS = 10800000; // 3 часа

    const startDay1 = trunc(endToday + MS_IN_3_HOURS);
    const endDay1 = trunc(endToday + MS_IN_DAY);
    const startDay2 = trunc((endDay1 * 1000) + MS_IN_3_HOURS);
    const endDay2 = trunc((endDay1 * 1000) + MS_IN_DAY);
    const startDay3 = trunc((endDay2 * 1000) + MS_IN_3_HOURS);
    const endDay3 = trunc((endDay2 * 1000) + MS_IN_DAY);
    const startDay4 = trunc((endDay3 * 1000) + MS_IN_3_HOURS);
    const endDay4 = trunc((endDay3 * 1000) + MS_IN_DAY);
    const startDay5 = trunc((endDay4 * 1000) + MS_IN_3_HOURS);
    const endDay5 = trunc((endDay4 * 1000) + MS_IN_DAY);

    for (let i = 0; i < list.length; i++) {
      if (list[i]['dt'] >= startDay1 && list[i]['dt'] <= endDay1) {
        document.querySelector(`section.day1 .hourly-today-hour`).innerHTML += `<td>${timestampConversation(list[i]['dt'])}</td>`;
        document.querySelector(`section.day1 .hourly-today-icon`).innerHTML += `<td><img src='https://openweathermap.org/img/wn/${list[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
        document.querySelector(`section.day1 .hourly-today-description`).innerHTML += `<td>${list[i]['weather'][0]['description']}</td>`;
        document.querySelector(`section.day1 .hourly-today-temp`).innerHTML += `<td>${Math.round(list[i]['main']['temp'])}&deg;</td>`;
        document.querySelector(`section.day1 .hourly-today-feel`).innerHTML += `<td>${Math.round(list[i]['main']['feels_like'])}&deg;</td>`;
        document.querySelector(`section.day1 .hourly-today-wind`).innerHTML += `<td>${Math.round(list[i]['wind']['speed'])}</td>`;
        document.querySelector(`section.day1 .hourly-today-degrees`).innerHTML += `<td>${windDeg(list[i]['wind']['deg'])}</td>`;
        document.querySelector(`section.day1 .hourly-today-wind_gust`).innerHTML += `<td>${list[i]['wind']['gust']}</td>`;
        document.querySelector(`section.day1 .hourly-today-humidity`).innerHTML += `<td>${list[i]['main']['humidity']}%</td>`;
        document.querySelector(`section.day1 .hourly-today-pressure`).innerHTML += `<td>${Math.floor((list[i]['main']['pressure'] * 0.75006156) * 100) / 100}</td>`;
        document.querySelector(`section.day1 .hourly-today-visibility`).innerHTML += `<td>${list[i]['visibility'] / 1000}</td>`;
      } else if (list[i]['dt'] >= startDay2 && list[i]['dt'] <= endDay2) {
        document.querySelector(`section.day2 .hourly-today-hour`).innerHTML += `<td>${timestampConversation(list[i]['dt'])}</td>`;
        document.querySelector(`section.day2 .hourly-today-icon`).innerHTML += `<td><img src='https://openweathermap.org/img/wn/${list[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
        document.querySelector(`section.day2 .hourly-today-description`).innerHTML += `<td>${list[i]['weather'][0]['description']}</td>`;
        document.querySelector(`section.day2 .hourly-today-temp`).innerHTML += `<td>${Math.round(list[i]['main']['temp'])}&deg;</td>`;
        document.querySelector(`section.day2 .hourly-today-feel`).innerHTML += `<td>${Math.round(list[i]['main']['feels_like'])}&deg;</td>`;
        document.querySelector(`section.day2 .hourly-today-wind`).innerHTML += `<td>${Math.round(list[i]['wind']['speed'])}</td>`;
        document.querySelector(`section.day2 .hourly-today-degrees`).innerHTML += `<td>${windDeg(list[i]['wind']['deg'])}</td>`;
        document.querySelector(`section.day2 .hourly-today-wind_gust`).innerHTML += `<td>${list[i]['wind']['gust']}</td>`;
        document.querySelector(`section.day2 .hourly-today-humidity`).innerHTML += `<td>${list[i]['main']['humidity']}%</td>`;
        document.querySelector(`section.day2 .hourly-today-pressure`).innerHTML += `<td>${Math.floor((list[i]['main']['pressure'] * 0.75006156) * 100) / 100}</td>`;
        document.querySelector(`section.day2 .hourly-today-visibility`).innerHTML += `<td>${list[i]['visibility'] / 1000}</td>`;
      } else if (list[i]['dt'] >= startDay3 && list[i]['dt'] <= endDay3) {
        document.querySelector(`section.day3 .hourly-today-hour`).innerHTML += `<td>${timestampConversation(list[i]['dt'])}</td>`;
        document.querySelector(`section.day3 .hourly-today-icon`).innerHTML += `<td><img src='https://openweathermap.org/img/wn/${list[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
        document.querySelector(`section.day3 .hourly-today-description`).innerHTML += `<td>${list[i]['weather'][0]['description']}</td>`;
        document.querySelector(`section.day3 .hourly-today-temp`).innerHTML += `<td>${Math.round(list[i]['main']['temp'])}&deg;</td>`;
        document.querySelector(`section.day3 .hourly-today-feel`).innerHTML += `<td>${Math.round(list[i]['main']['feels_like'])}&deg;</td>`;
        document.querySelector(`section.day3 .hourly-today-wind`).innerHTML += `<td>${Math.round(list[i]['wind']['speed'])}</td>`;
        document.querySelector(`section.day3 .hourly-today-degrees`).innerHTML += `<td>${windDeg(list[i]['wind']['deg'])}</td>`;
        document.querySelector(`section.day3 .hourly-today-wind_gust`).innerHTML += `<td>${list[i]['wind']['gust']}</td>`;
        document.querySelector(`section.day3 .hourly-today-humidity`).innerHTML += `<td>${list[i]['main']['humidity']}%</td>`;
        document.querySelector(`section.day3 .hourly-today-pressure`).innerHTML += `<td>${Math.floor((list[i]['main']['pressure'] * 0.75006156) * 100) / 100}</td>`;
        document.querySelector(`section.day3 .hourly-today-visibility`).innerHTML += `<td>${list[i]['visibility'] / 1000}</td>`;
      } else if (list[i]['dt'] >= startDay4 && list[i]['dt'] <= endDay4) {
        document.querySelector(`section.day4 .hourly-today-hour`).innerHTML += `<td>${timestampConversation(list[i]['dt'])}</td>`;
        document.querySelector(`section.day4 .hourly-today-icon`).innerHTML += `<td><img src='https://openweathermap.org/img/wn/${list[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
        document.querySelector(`section.day4 .hourly-today-description`).innerHTML += `<td>${list[i]['weather'][0]['description']}</td>`;
        document.querySelector(`section.day4 .hourly-today-temp`).innerHTML += `<td>${Math.round(list[i]['main']['temp'])}&deg;</td>`;
        document.querySelector(`section.day4 .hourly-today-feel`).innerHTML += `<td>${Math.round(list[i]['main']['feels_like'])}&deg;</td>`;
        document.querySelector(`section.day4 .hourly-today-wind`).innerHTML += `<td>${Math.round(list[i]['wind']['speed'])}</td>`;
        document.querySelector(`section.day4 .hourly-today-degrees`).innerHTML += `<td>${windDeg(list[i]['wind']['deg'])}</td>`;
        document.querySelector(`section.day4 .hourly-today-wind_gust`).innerHTML += `<td>${list[i]['wind']['gust']}</td>`;
        document.querySelector(`section.day4 .hourly-today-humidity`).innerHTML += `<td>${list[i]['main']['humidity']}%</td>`;
        document.querySelector(`section.day4 .hourly-today-pressure`).innerHTML += `<td>${Math.floor((list[i]['main']['pressure'] * 0.75006156) * 100) / 100}</td>`;
        document.querySelector(`section.day4 .hourly-today-visibility`).innerHTML += `<td>${list[i]['visibility'] / 1000}</td>`;
      } else if (list[i]['dt'] >= startDay5 && list[i]['dt'] <= endDay5) {
        document.querySelector(`section.day5 .hourly-today-hour`).innerHTML += `<td>${timestampConversation(list[i]['dt'])}</td>`;
        document.querySelector(`section.day5 .hourly-today-icon`).innerHTML += `<td><img src='https://openweathermap.org/img/wn/${list[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
        document.querySelector(`section.day5 .hourly-today-description`).innerHTML += `<td>${list[i]['weather'][0]['description']}</td>`;
        document.querySelector(`section.day5 .hourly-today-temp`).innerHTML += `<td>${Math.round(list[i]['main']['temp'])}&deg;</td>`;
        document.querySelector(`section.day5 .hourly-today-feel`).innerHTML += `<td>${Math.round(list[i]['main']['feels_like'])}&deg;</td>`;
        document.querySelector(`section.day5 .hourly-today-wind`).innerHTML += `<td>${Math.round(list[i]['wind']['speed'])}</td>`;
        document.querySelector(`section.day5 .hourly-today-degrees`).innerHTML += `<td>${windDeg(list[i]['wind']['deg'])}</td>`;
        document.querySelector(`section.day5 .hourly-today-wind_gust`).innerHTML += `<td>${list[i]['wind']['gust']}</td>`;
        document.querySelector(`section.day5 .hourly-today-humidity`).innerHTML += `<td>${list[i]['main']['humidity']}%</td>`;
        document.querySelector(`section.day5 .hourly-today-pressure`).innerHTML += `<td>${Math.floor((list[i]['main']['pressure'] * 0.75006156) * 100) / 100}</td>`;
        document.querySelector(`section.day5 .hourly-today-visibility`).innerHTML += `<td>${list[i]['visibility'] / 1000}</td>`;
      }
    }
  }

  async function getOneCallAPI(lat, lon) {
    const params = createParams(lat, lon);
    const paramsWithExclude = new URLSearchParams({
      ...params,
      exclude: 'current,minutely,alerts'
    });
    const url = `${baseURL}/3.0/onecall?${paramsWithExclude}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        showError(response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status}, ${response.statusText}`);
      }

      const oneCall = await response.json();
      renderOneCallAPI(oneCall);
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
  }

  function renderOneCallAPI({daily, hourly}) {

    document.querySelector('.hourly .hourly-today-hour').innerHTML = '<th class="today"></th>';
    document.querySelector('.hourly .hourly-today-icon').innerHTML = '<th></th>';
    document.querySelector('.hourly .hourly-today-description').innerHTML = '<th>Прогноз</th>';
    document.querySelector('.hourly .hourly-today-temp').innerHTML = '<th>Температура (&deg;C)</th>';
    document.querySelector('.hourly .hourly-today-feel').innerHTML = '<th>Ощущается (&deg;C)</th>';
    document.querySelector('.hourly .hourly-today-wind').innerHTML = '<th>Ветер (м/с)</th>';
    document.querySelector('.hourly .hourly-today-degrees').innerHTML = '<th>Направление</th>';
    document.querySelector('.hourly .hourly-today-wind_gust').innerHTML = '<th>Порывы (м/с)</th>';
    document.querySelector('.hourly .hourly-today-dew_point').innerHTML = '<th>Точка росы (&deg;C)</th>';
    document.querySelector('.hourly .hourly-today-humidity').innerHTML = '<th>Влажность</th>';
    document.querySelector('.hourly .hourly-today-pressure').innerHTML = '<th>Давление (mmHg)</th>';
    document.querySelector('.hourly .hourly-today-visibility').innerHTML = '<th>Видимость (км)</th>';

    const todayAt23 = currentDate.setHours(23, 0, 0);
    const tomorrowAt6 = todayAt23 + 25200000;
    const timestampSeconds = Math.trunc(tomorrowAt6 / 1000);

    for (let i = 0; i < hourly.length; i++) {
      document.querySelector('.hourly .hourly-today-hour').innerHTML += `<td>${timestampConversation(hourly[i]['dt'])}</td>`;
      document.querySelector('.hourly .hourly-today-icon').innerHTML += `<td><img src='https://openweathermap.org/img/wn/${hourly[i]['weather'][0]['icon']}@2x.png' alt='icon'/></td>`;
      document.querySelector('.hourly .hourly-today-description').innerHTML += `<td>${hourly[i]['weather'][0]['description']}</td>`;
      document.querySelector('.hourly .hourly-today-temp').innerHTML += `<td>${Math.round(hourly[i]['temp'])}&deg;</td>`;
      document.querySelector('.hourly .hourly-today-feel').innerHTML += `<td>${Math.round(hourly[i]['feels_like'])}&deg;</td>`;
      document.querySelector('.hourly .hourly-today-wind').innerHTML += `<td>${Math.round(hourly[i]['wind_speed'])}</td>`;
      document.querySelector('.hourly .hourly-today-degrees').innerHTML += `<td>${windDeg(hourly[i]['wind_deg'])}</td>`;
      document.querySelector('.hourly .hourly-today-wind_gust').innerHTML += `<td>${hourly[i]['wind_gust']}</td>`;
      document.querySelector('.hourly .hourly-today-dew_point').innerHTML += `<td>${hourly[i]['dew_point']}&deg;</td>`;
      document.querySelector('.hourly .hourly-today-humidity').innerHTML += `<td>${hourly[i]['humidity']}%</td>`;
      document.querySelector('.hourly .hourly-today-pressure').innerHTML += `<td>${Math.floor((hourly[i]['pressure'] * 0.75006156) * 100) / 100}</td>`;
      document.querySelector('.hourly .hourly-today-visibility').innerHTML += `<td>${hourly[i]['visibility'] / 1000}</td>`;
      if (hourly[i]['dt'] === timestampSeconds) break
    }

    for (let i = 1; i <= 5; i++) {
      let todayMM = getDay((daily[i]['dt']) * 1000).getMonth();
      let todayDD = getDay((daily[i]['dt']) * 1000).getDate();

      document.querySelector(`li.day${i} h3`).innerHTML = `${dayRu[getDay(daily[i]['dt'] * 1000).getDay()]}`;
      document.querySelector(`li.day${i} .forecast-day-date`).innerHTML = `${monthsRus[todayMM]} ${todayDD}`;
      document.querySelector(`li.day${i} .forecast-day-icon`).innerHTML = `<img src='https://openweathermap.org/img/wn/${daily[i]['weather']['0']['icon']}@2x.png' alt='icon'/>`;
      document.querySelector(`li.day${i} .forecast-day-temperature`).innerHTML = `${Math.floor(daily[i]['temp']['max'])}&deg;C`;
      document.querySelector(`li.day${i} .forecast-day-description`).innerHTML = `${daily[i]['weather'][0]['description']}`
    }
  }
});