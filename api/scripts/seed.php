<?php
// Run with: php scripts/seed.php
// Creates the initial admin login and a couple of sample services, so the
// app has something to test against immediately after schema import.

require_once __DIR__ . '/../config/database.php';

$db = getDb();

$adminEmail = env('SEED_ADMIN_EMAIL', 'admin@sunshinesocial.org');
$adminPassword = env('SEED_ADMIN_PASSWORD', 'change-this-immediately');
$adminName = env('SEED_ADMIN_NAME', 'Super Admin');

$existing = $db->prepare('SELECT id FROM admin_users WHERE email = ?');
$existing->execute([$adminEmail]);
if (!$existing->fetch()) {
    $stmt = $db->prepare('
        INSERT INTO admin_users (id, full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        generateUuid(), $adminName, $adminEmail,
        password_hash($adminPassword, PASSWORD_DEFAULT), 'SUPER_ADMIN',
    ]);
    echo "Created admin login: $adminEmail\n";
} else {
    echo "Admin login already exists: $adminEmail\n";
}

$services = [
    ['name' => 'Physiotherapy Session', 'description' => 'One-on-one physiotherapy for pain relief and mobility, at up to 75% subsidised cost.'],
    ['name' => 'Body Pain Relief Therapy', 'description' => 'Automated massage chair / leg massager sessions for therapeutic relief.'],
    ['name' => 'Health Parameter Screening', 'description' => 'Free BP, blood sugar, and basic health metric screening.'],
];

foreach ($services as $service) {
    $check = $db->prepare('SELECT id FROM services WHERE name = ?');
    $check->execute([$service['name']]);
    if (!$check->fetch()) {
        $stmt = $db->prepare('INSERT INTO services (id, name, description) VALUES (?, ?, ?)');
        $stmt->execute([generateUuid(), $service['name'], $service['description']]);
    }
}
echo "Seeded services.\n";

$clinicCheck = $db->prepare('SELECT id FROM clinics WHERE name = ?');
$clinicCheck->execute(['Sample Partner Physiotherapy Clinic']);
$clinic = $clinicCheck->fetch();
if (!$clinic) {
    $clinicId = generateUuid();
    $db->prepare('INSERT INTO clinics (id, name, city, address, contact_person, mobile_number, email) VALUES (?, ?, ?, ?, ?, ?, ?)')
       ->execute([$clinicId, 'Sample Partner Physiotherapy Clinic', 'Indore', 'Replace with real address', 'Dr. Replace Name', '9000000000', 'clinic@partnerclinic.example']);
} else {
    $clinicId = $clinic['id'];
}

$seedClinicEmail = env('SEED_CLINIC_EMAIL', 'clinic@partnerclinic.example');
$seedClinicPassword = env('SEED_CLINIC_PASSWORD', 'change-this-immediately');

$clinicUserCheck = $db->prepare('SELECT id FROM clinic_users WHERE email = ?');
$clinicUserCheck->execute([$seedClinicEmail]);
if (!$clinicUserCheck->fetch()) {
    $db->prepare('INSERT INTO clinic_users (id, clinic_id, full_name, email, password_hash) VALUES (?, ?, ?, ?, ?)')
       ->execute([generateUuid(), $clinicId, 'Clinic Front Desk', $seedClinicEmail, password_hash($seedClinicPassword, PASSWORD_DEFAULT)]);
    echo "Created clinic login: $seedClinicEmail\n";
}

echo "Seed complete.\n";
