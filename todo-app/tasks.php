<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$filename = 'tasks.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['taskTitle'], $_POST['taskDate'], $_POST['taskPriority'])) {
        // Добавяне на нова задача
        $newTask = [
            'title' => htmlspecialchars($_POST['taskTitle']),
            'date' => htmlspecialchars($_POST['taskDate']),
            'priority' => htmlspecialchars($_POST['taskPriority']),
        ];

        // Четене на съществуващите задачи
        $tasks = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];
        $tasks[] = $newTask;

        // Запис на задачите
        file_put_contents($filename, json_encode($tasks, JSON_PRETTY_PRINT));
        header('Location: index.html'); // Връщане към началната страница
        exit;
    }

    if (isset($_POST['deleteIndex'])) {
        // Изтриване на задача по индекс
        $tasks = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];
        $deleteIndex = intval($_POST['deleteIndex']);

        if (isset($tasks[$deleteIndex])) {
            array_splice($tasks, $deleteIndex, 1); // Премахване на задачата
            file_put_contents($filename, json_encode($tasks, JSON_PRETTY_PRINT));
        }

        echo json_encode(['success' => true]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Извличане на задачите
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        echo json_encode([]);
    }
}
?>
