<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT');
header("Access-Control-Allow-Headers: Content-Type");

$file = 'tasks.json';

if(!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

$tasks = json_decode(file_get_contents($file), true);
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['search']) && $_GET['search'] !== '') {
            $search = mb_strtolower($_GET['search']);
            $filtered = array_filter($tasks, function($t) use($search) {
                return (mb_strpos(mb_strtolower($t['title']), $search) !== false) ||
                       (mb_strpos(mb_strtolower($t['regnum']), $search) !== false) ||
                       (mb_strpos(mb_strtolower($t['problem']), $search) !== false) ||
                       (isset($t['date']) && mb_strpos(mb_strtolower($t['date']), $search) !== false) ||
                       (mb_strpos(mb_strtolower($t['time']), $search) !== false) ||
                       (mb_strpos(mb_strtolower($t['priority']), $search) !== false) ||
                       (mb_strpos(mb_strtolower($t['status']), $search) !== false);
            });
            echo json_encode(array_values($filtered), JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode($tasks, JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if(!isset($input['title']) || !isset($input['time']) || !isset($input['regnum']) || !isset($input['priority']) || !isset($input['problem']) || !isset($input['date']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error'=>'Missing fields'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $tasks[] = [
            'title' => $input['title'],
            'date' => $input['date'],
            'time' => $input['time'],
            'regnum' => strtoupper($input['regnum']),
            'priority' => $input['priority'],
            'status' => $input['status'],
            'problem' => $input['problem'],
            'image' => $input['image'] ?? ''
        ];
        file_put_contents($file, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success'=>true], JSON_UNESCAPED_UNICODE);
        break;

    case 'DELETE':
        if(!isset($_GET['index'])) {
            http_response_code(400);
            echo json_encode(['error'=>'Missing index'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $index = intval($_GET['index']);
        if($index < 0 || $index >= count($tasks)) {
            http_response_code(404);
            echo json_encode(['error'=>'Task not found'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        array_splice($tasks, $index, 1);
        file_put_contents($file, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success'=>true], JSON_UNESCAPED_UNICODE);
        break;

    case 'PUT':
        if(!isset($_GET['index'])) {
            http_response_code(400);
            echo json_encode(['error'=>'Missing index'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $index = intval($_GET['index']);
        if($index < 0 || $index >= count($tasks)) {
            http_response_code(404);
            echo json_encode(['error'=>'Task not found'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if(!isset($input['title']) || !isset($input['time']) || !isset($input['regnum']) || !isset($input['priority']) || !isset($input['problem']) || !isset($input['date']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error'=>'Missing fields'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $tasks[$index]['title'] = $input['title'];
        $tasks[$index]['date'] = $input['date'];
        $tasks[$index]['time'] = $input['time'];
        $tasks[$index]['regnum'] = strtoupper($input['regnum']);
        $tasks[$index]['priority'] = $input['priority'];
        $tasks[$index]['status'] = $input['status'];
        $tasks[$index]['problem'] = $input['problem'];
        if(isset($input['image']) && $input['image'] !== '') {
            $tasks[$index]['image'] = $input['image'];
        }

        file_put_contents($file, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success'=>true], JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error'=>'Method not allowed'], JSON_UNESCAPED_UNICODE);
}
