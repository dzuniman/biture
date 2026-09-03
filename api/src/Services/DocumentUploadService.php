<?php

declare(strict_types=1);

final class DocumentUploadService
{
    public function __construct(private PDO $pdo, private string $dataDirectory)
    {
    }

    public function upload(): never
    {
        $file = $_FILES['file'] ?? null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) fail('File is required.', 400);
        $documentName = trim((string)($_POST['documentName'] ?? ''));
        if ($documentName === '') fail('Document Name is required.', 400);

        $directory = $this->dataDirectory . DIRECTORY_SEPARATOR . 'documents';
        if (!is_dir($directory)) mkdir($directory, 0775, true);
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $name = uuid() . ($extension ? '.' . $extension : '');
        $path = $directory . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($file['tmp_name'], $path)) fail('Unable to store document.', 500);

        $description = !empty($_POST['description']) ? trim((string)$_POST['description']) : null;
        $folderId = (!empty($_POST['folderId']) && $_POST['folderId'] !== 'null') ? trim((string)$_POST['folderId']) : null;

        // ✅ Only change: use MySQL-friendly timestamp
        $uploadedAt = date('Y-m-d H:i:s');

        $row = [
            uuid(),
            $documentName,
            $description,
            $name,
            $path,
            $file['type'] ?: 'application/octet-stream',
            $uploadedAt,
            $folderId
        ];

        try {
            $this->pdo->prepare(
                'INSERT INTO documents (id, DocumentName, Description, FileName, FilePath, ContentType, UploadedAt, FolderId)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute($row);
        } catch (Throwable $e) {
            fail('Failed to save document metadata: ' . $e->getMessage(), 500);
        }

        jsonResponse(
            serializeRow($this->pdo, 'documents', [
                'id'           => $row[0],
                'document_name'=> $row[1],
                'description'  => $row[2],
                'file_name'    => $row[3],
                'file_path'    => $row[4],
                'content_type' => $row[5],
                'uploaded_at'  => $row[6],
                'folder_id'    => $row[7],
            ], true),
            201
        );
    }
}
