<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


$host = "localhost";
$user = "root";
$password = "";
$dbName = "fatodolistphp";

error_reporting(E_ALL);
ini_set('display_errors', 1); // Hataları göster

try {
    $dsn = "mysql:host=" . $host . ";dbname=" . $dbName;
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);

    // POST isteği ile görev ekleme işlemi
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        // JSON verisini al
        $data = json_decode(file_get_contents("php://input"), true);

        // Verinin doğru geldiğini kontrol et
        $gorevAdi = $data['gorevAdi'] ?? '';
        $checked = $data['checked'] ?? 0; // Varsayılan değer 0

        // Görev adı boşsa işlem yapılmasın
        if (empty($gorevAdi)) {
            echo json_encode(['hata' => 'Görev adı boş olamaz.']);
            return;
        }

        // Aynı görev adını kontrol et
        $ayniGorevsql = "SELECT gorevAdi FROM gorevler";
        $ayniGorev = $pdo->query($ayniGorevsql);
        $ayni = $ayniGorev->fetchAll(PDO::FETCH_ASSOC); // Tüm görev adlarını çek

        foreach ($ayni as $gorev) {
            $gorevAdiDb = $gorev['gorevAdi']; // Veritabanındaki görev adını al

            // Görev adını kıyasla, aynı görev adı varsa hata döndür
            if (strtolower(trim($gorevAdiDb)) === strtolower(trim($gorevAdi))) {
                echo json_encode(['hata' => 'Bu görev zaten mevcut.']); // Aynı görev adı bulundu
                return;
            }
        }

        // Veritabanına ekleme işlemi
        $sql = "INSERT INTO gorevler (gorevAdi, checked) VALUES (:gorevAdi, :checked)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'gorevAdi' => $gorevAdi,
            'checked' => $checked,
        ]);

        // Ekleme işlemi başarılıysa, tüm görevleri döndür
        $stmt = $pdo->query("SELECT * FROM gorevler");
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($todos);
    }


    // GET isteği ile görevleri çekme işlemi
    elseif ($_SERVER['REQUEST_METHOD'] == 'GET') {
        // Arama terimini kontrol et
        $searchTerm = $_GET['searchTerm'] ?? '';

        // Eğer bir arama terimi varsa, görevi filtrele
        if ($searchTerm) {
            $sql = "SELECT * FROM gorevler WHERE gorevAdi LIKE :searchTerm";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['searchTerm' => '%' . $searchTerm . '%']); // LIKE ile filtrele
        } else {
            // Veritabanından tüm görevleri çek
            $stmt = $pdo->query("SELECT * FROM gorevler");
        }

        $todos = $stmt->fetchAll();
        echo json_encode($todos);
    }
    // DELETE isteği ile görevleri silme işlemi
    elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        parse_str(file_get_contents("php://input"), $data); // DELETE verilerini al
        $check_id = $data['id'] ?? ''; // Yeni checked değerini al
        $operation = $data['operation'] ?? '';
        $checked = $data['checked'] ?? '';

        if ($operation == 'delete_onetask') {
            try {
                $sql = "DELETE FROM gorevler WHERE id=:id"; // seçilen id görevini sil 
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $check_id]);
                echo json_encode(['success' => true]); // Başarı mesajı
            } catch (PDOException $e) {
                echo json_encode(['error' => 'Tüm görevler silinirken hata oluştu: ' . $e->getMessage()]);
            }
        } else if ($operation == 'check_delete') {
            // checked değeri 1 olan tüm görevleri sil
            try {
                $sql = "DELETE FROM gorevler WHERE checked = 1"; // Sadece checked = 1 olanları sil
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                echo json_encode(['success' => true]); // Başarı mesajı
            } catch (PDOException $e) {
                echo json_encode(['error' => 'Tüm görevler silinirken hata oluştu: ' . $e->getMessage()]);
            }
        } else if ($operation == 'delete_all') {
            try {
                // Tüm görevleri sil
                $sql = "DELETE FROM gorevler"; // Burada tüm görevleri sil
                $stmt = $pdo->prepare($sql);
                $stmt->execute();

                // Başarılı bir yanıt döndür
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                // Hata durumunda uygun bir yanıt döndür
                echo json_encode(['success' => false, 'error' => 'Tüm görevler silinirken hata oluştu: ' . $e->getMessage()]);
            }
        } else {
            $id = $data['id'] ?? ''; // Görev ID'sini al
            if ($id) {
                $sql = "DELETE FROM gorevler WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $id]);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['error' => 'Görev ID bulunamadı.']);
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
        parse_str(file_get_contents("php://input"), $data); // PUT verilerini al
        $checked = $data['checked'] ?? ''; // Yeni checked değerini al
        $check_id = $data['id'] ?? ''; // Yeni id değerini al
        $operation = $data['operation'] ?? ''; // Operation parametresi

        if ($operation == 'check_item') {
            if ($checked === '' || $check_id === '') {
                echo json_encode(['error' => 'Checked veya ID değeri eksik.']);
                return;
            }

            $sql = "UPDATE gorevler SET checked = :checked WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'checked' => $checked,
                'id' => $check_id
            ]);

            // Güncellenen tüm görevleri döndür
            $stmt = $pdo->query("SELECT * FROM gorevler");
            $todos = $stmt->fetchAll();
            echo json_encode(['success' => true, 'todos' => $todos]); // Başarı durumu
        } else if ($data['operation'] == 'check_all') {
            // Tüm görevleri güncelle
            $sql = "UPDATE gorevler SET checked = :checked";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['checked' => 1]); // Bütün görevleri 1 yap (yapıldı)

            // Güncellenmiş görevleri döndür
            $stmt = $pdo->query("SELECT * FROM gorevler");
            $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($todos);
        } else {
            echo json_encode(['error' => 'Operation hatalı veya eksik.']);
        }
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Bağlantı hatası: ' . $e->getMessage()]);
}
