const userId = "123"; // Уникальный идентификатор пользователя
const API_URL = 'http://localhost:5000';

// Месяцы на русском языке
const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// Дни недели на русском языке с субботой и воскресеньем в конце
const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

document.addEventListener("DOMContentLoaded", async () => {
    const calendar = document.getElementById("calendar");
    const monthNameEl = document.getElementById("month-name");
    const weekdaysEl = document.getElementById("weekdays");
    const workdaysCountEl = document.getElementById("workdays-count");
  
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  
    monthNameEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
    // Создаем заголовок для дней недели с субботой и воскресеньем в конце
    dayNames.forEach(day => {
      const dayNameEl = document.createElement("div");
      dayNameEl.textContent = day;
      weekdaysEl.appendChild(dayNameEl);
    });
  
    // Получаем отработанные дни из базы данных
    const workdays = await fetchWorkdays();
  
    // Обновляем количество отработанных дней
    updateWorkdaysCount(workdays.length);
  
    // Определяем первый день месяца и количество дней в месяце
    const firstDayOfMonth = monthStart.getDay(); // День недели для 1 числа месяца
    const daysInMonth = monthEnd.getDate(); // Общее количество дней в месяце
  
    // Заполняем пустые ячейки до первого дня месяца
    let shiftFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Перемещаем воскресенье в конец
    for (let i = 0; i < shiftFirstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.classList.add("empty");
      calendar.appendChild(emptyDay);
    }
  
    // Отображаем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const formattedDate = date.toISOString().split("T")[0];
      const dayElement = document.createElement("div");
      dayElement.classList.add("day");
      dayElement.textContent = day;
  
      // Подсветка выходных дней (суббота и воскресенье)
      if (date.getDay() === 6 || date.getDay() === 0) {
        dayElement.classList.add("weekend");
      }
  
      // Подсветка отработанных дней
      if (workdays.includes(formattedDate)) {
        dayElement.classList.add("highlight");
      }
  
      // Добавляем обработчик событий для мобильных и десктопных устройств
      dayElement.addEventListener("click", () => toggleWorkday(date, dayElement)); // Для ПК
      dayElement.addEventListener("touchend", () => toggleWorkday(date, dayElement)); // Для мобильных устройств
  
      calendar.appendChild(dayElement);
    }
  });
  
  // Функция для получения отработанных дней
  async function fetchWorkdays() {
    try {
      const response = await fetch(`${API_URL}/workdays/${userId}`);
      const data = await response.json();
      console.log("Fetched workdays:", data); // Проверка на успешную загрузку данных
      return data.map(day => new Date(day.date).toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error fetching workdays:", error);
      return [];
    }
  }
  
  // Функция для отметки дня
  async function toggleWorkday(date, dayElement) {
    const formattedDate = date.toISOString().split("T")[0];
  
    if (dayElement.classList.contains("highlight")) {
      // Удаление отработанного дня из базы данных
      try {
        const response = await fetch(`${API_URL}/workday`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ date, userId })
        });
        if (response.ok) {
          dayElement.classList.remove("highlight");
          // Обновляем количество отработанных дней после удаления
          updateWorkdaysCount(await getWorkdaysCount());
        } else {
          console.error("Error removing workday:", await response.json());
        }
      } catch (error) {
        console.error("Error removing workday:", error);
      }
    } else {
      // Добавление отработанного дня в базу данных
      try {
        const response = await fetch(`${API_URL}/workday`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ date, userId })
        });
        if (response.ok) {
          dayElement.classList.add("highlight");
          // Обновляем количество отработанных дней после добавления
          updateWorkdaysCount(await getWorkdaysCount());
        } else {
          console.error("Error adding workday:", await response.json());
        }
      } catch (error) {
        console.error("Error adding workday:", error);
      }
    }
  }
  
  // Функция для получения текущего количества отработанных дней
  async function getWorkdaysCount() {
    try {
      const workdays = await fetchWorkdays();
      return workdays.length;
    } catch (error) {
      console.error("Error fetching workdays count:", error);
      return 0;
    }
  }
  
  // Функция для обновления отображения количества отработанных дней
  function updateWorkdaysCount(count) {
    const workdaysCountEl = document.getElementById("workdays-count");
    workdaysCountEl.textContent = `Отработано: ${--count} дней`;
  }
  