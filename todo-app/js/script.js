$(document).ready(function () {
    let tasks = [];
    let selectedImageData = "";

    const taskForm = $('#taskForm');
    const taskImageInput = $('#taskImage');
    const notebookBody = $('#notebookBody');
    const searchInput = $('#searchInput');

    function renderTasks(taskList) {
        notebookBody.empty();
        if(taskList.length === 0) {
            notebookBody.html("<p>Няма задачи.</p>");
            return;
        }
        taskList.forEach((task, index) => {
            const taskElem = $(`
                <div class="notebook-task" data-index="${index}">
                    <span><strong>Заглавие:</strong> ${task.title}</span>
                    <span><strong>Дата:</strong> ${task.date || '—'}</span>
                    <span><strong>Час:</strong> ${task.time}</span>
                    <span><strong>Рег. номер:</strong> ${task.regnum}</span>
                    <span><strong>Приоритет:</strong> ${task.priority}</span>
                    <span><strong>Статус:</strong> ${task.status}</span>
                    <span><strong>Проблем:</strong> ${task.problem}</span>
                    <button data-index="${index}" class="delete-task">X</button>
                </div>
            `);
            taskElem.click(function(e) {
                if(!$(e.target).hasClass('delete-task')){
                    showModal(task);
                }
            });
            notebookBody.append(taskElem);
        });
    }

    function loadTasks(search="") {
        $.getJSON('tasks_api.php', {search: search}, function(data) {
            tasks = data;
            renderTasks(tasks);
            drawTasksOnCanvas(tasks);
        });
    }

    $('#taskRegNum').on('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    function addTask() {
        const title = $('input[name="taskTitle"]').val().trim();
        const date = $('input[name="taskDate"]').val().trim();
        const time = $('input[name="taskTime"]').val().trim();
        const regnum = $('input[name="taskRegNum"]').val().trim();
        const priority = $('select[name="taskPriority"]').val().trim();
        const status = $('select[name="taskStatus"]').val().trim();
        const problem = $('textarea[name="taskProblem"]').val().trim();

        if(!title || !time || !regnum || !priority || !problem || !date || !status) {
            alert("Моля попълнете всички задължителни полета.");
            return;
        }

        const regnumPattern = /^[A-Z0-9]{1,8}$/;
        if(!regnumPattern.test(regnum)) {
            alert("Моля въведете валиден регистрационен номер (до 8 главни букви и цифри).");
            return;
        }

        const file = taskImageInput[0].files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                selectedImageData = evt.target.result;
                $.ajax({
                    url: 'tasks_api.php',
                    method: 'POST',
                    data: JSON.stringify({ title, date, time, regnum, priority, problem, image: selectedImageData, status}),
                    contentType: 'application/json',
                    success: function() {
                        loadTasks(searchInput.val());
                        taskForm[0].reset();
                        selectedImageData = "";
                    }
                });
            }
            reader.readAsDataURL(file);
        } else {
            $.ajax({
                url: 'tasks_api.php',
                method: 'POST',
                data: JSON.stringify({ title, date, time, regnum, priority, problem, image: "", status}),
                contentType: 'application/json',
                success: function() {
                    loadTasks(searchInput.val());
                    taskForm[0].reset();
                    selectedImageData = "";
                }
            });
        }
    }

    taskForm.on('submit', function(e) {
        e.preventDefault();
        addTask();
    });

    $(document).on('click', '.delete-task', function (e) {
        e.stopPropagation();
        const index = $(this).data('index');
        $.ajax({
            url: 'tasks_api.php?index='+index,
            method: 'DELETE',
            success: function(){
                loadTasks(searchInput.val());
            }
        });
    });

    searchInput.on('input', function() {
        const searchVal = $(this).val().trim();
        loadTasks(searchVal);
    });

    function drawTasksOnCanvas(tasks) {
        const canvas = document.getElementById('tasksCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);

        if(tasks.length === 0) return;

        let times = tasks.map(t => {
            let [h,m] = t.time.split(':');
            return parseInt(h)*60 + parseInt(m);
        });
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        ctx.font = "16px Roboto";
        ctx.fillStyle = "#2c3e50";
        ctx.fillText("График на задачи (по час)", 10, 30);

        const startX = 60;
        const startY = 60;
        const lineHeight = 40;
        const boxHeight = 30;

        const totalMinutes = maxTime - minTime || 60;
        const hourWidth = (canvas.width - 80) / (totalMinutes/60);

        ctx.font = "12px Roboto";
        ctx.fillStyle = "#333";
        const startHour = Math.floor(minTime/60);
        const endHour = Math.ceil(maxTime/60);
        for (let h = startHour; h <= endHour; h++) {
            const x = startX + ((h*60 - minTime)/60)*hourWidth;
            ctx.beginPath();
            ctx.moveTo(x, startY-10);
            ctx.lineTo(x, canvas.height - 20);
            ctx.strokeStyle = "#ccc";
            ctx.stroke();
            ctx.fillText(`${h}:00`, x+5, startY-15);
        }

        tasks.forEach((task, i) => {
            let [HH,MM] = task.time.split(':');
            const taskMinutes = parseInt(HH)*60 + parseInt(MM);
            const diff = taskMinutes - minTime;
            const x = startX + (diff/60)*hourWidth;
            const y = startY + i*lineHeight;

            let color = "#3498db";
            if(task.priority === "high") color = "#e74c3c";
            if(task.priority === "medium") color = "#f1c40f";
            if(task.priority === "low") color = "#2ecc71";

            ctx.fillStyle = color;
            ctx.fillRect(x, y, hourWidth/2, boxHeight);

            ctx.fillStyle = "#fff";
            ctx.font = "12px Roboto";
            ctx.fillText(task.title, x+5, y+20);
        });
    }

    function showModal(task) {
        const overlay = $('.modal-overlay');
        overlay.empty();
        const imgHtml = task.image ? `<img src="${task.image}" style="max-width:100%;margin-bottom:10px;border-radius:8px;">` : '';
        const modal = $(`
            <div class="modal">
                <button class="modal-close">&times;</button>
                <h2>${task.title}</h2>
                ${imgHtml}
                <p><strong>Дата:</strong> ${task.date || '—'}</p>
                <p><strong>Час:</strong> ${task.time}</p>
                <p><strong>Рег. номер:</strong> ${task.regnum}</p>
                <p><strong>Приоритет:</strong> ${task.priority}</p>
                <p><strong>Статус:</strong> ${task.status}</p>
                <p><strong>Проблем:</strong> ${task.problem}</p>
            </div>
        `);
        overlay.append(modal);
        overlay.fadeIn(200);

        modal.find('.modal-close').click(function(){
            overlay.fadeOut(200, function(){
                overlay.empty();
            });
        });
    }

    // Drag and drop за тефтера
    const notebook = document.querySelector('.notebook');
    if(notebook) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        notebook.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = notebook.offsetLeft;
            initialY = notebook.offsetTop;
            notebook.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                notebook.style.left = `${initialX + dx}px`;
                notebook.style.top = `${initialY + dy}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            notebook.style.cursor = 'grab';
        });
    }

    // Drag and drop за графика
    const scheduleContainer = document.querySelector('.schedule-container');
    if(scheduleContainer) {
        let isDraggingSchedule = false;
        let startX2, startY2, initialX2, initialY2;

        scheduleContainer.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('schedule-header')) {
                isDraggingSchedule = true;
                startX2 = e.clientX;
                startY2 = e.clientY;
                initialX2 = scheduleContainer.offsetLeft;
                initialY2 = scheduleContainer.offsetTop;
                scheduleContainer.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingSchedule) {
                const dx = e.clientX - startX2;
                const dy = e.clientY - startY2;
                scheduleContainer.style.left = `${initialX2 + dx}px`;
                scheduleContainer.style.top = `${initialY2 + dy}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingSchedule = false;
            scheduleContainer.style.cursor = 'grab';
        });
    }

    loadTasks();
});
