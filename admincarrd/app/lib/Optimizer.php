<?php

declare(strict_types=1);

namespace AdminCarrd;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use ZipArchive;

final class Optimizer
{
    private $config;
    private $projectRoot;
    private $logsDir;
    private $tmpDir;
    private $originalBackupsDir;
    private $publishBackupsDir;

    public function __construct(array $config)
    {
        $moduleRoot = defined('ADMINCARRD_ROOT') ? ADMINCARRD_ROOT : dirname(__DIR__, 2);
        $this->config = $config;
        $this->projectRoot = rtrim((string) ($config['project_root'] ?? dirname($moduleRoot)), '/\\');
        $this->logsDir = rtrim((string) ($config['logs_dir'] ?? $moduleRoot . '/var/logs'), '/\\');
        $this->tmpDir = rtrim((string) ($config['tmp_dir'] ?? $moduleRoot . '/var/uploads/tmp'), '/\\');
        $this->originalBackupsDir = rtrim((string) ($config['optimizer']['original_images_backup_dir'] ?? $moduleRoot . '/var/uploads/original-backups'), '/\\');
        $this->publishBackupsDir = rtrim((string) ($config['publish']['publish_backup_dir'] ?? $moduleRoot . '/var/uploads/publish-backups'), '/\\');

        $this->ensureDir($this->logsDir);
        $this->ensureDir($this->tmpDir);
        if ((bool) ($config['optimizer']['keep_original_images_backup'] ?? false)) {
            $this->ensureDir($this->originalBackupsDir);
        }
        if ((bool) ($config['publish']['keep_publish_backup'] ?? false)) {
            $this->ensureDir($this->publishBackupsDir);
        }
    }

    public static function getPublishTargets(array $config): array
    {
        $moduleRoot = defined('ADMINCARRD_ROOT') ? ADMINCARRD_ROOT : dirname(__DIR__, 2);
        $root = rtrim((string) ($config['project_root'] ?? dirname($moduleRoot)), '/\\');
        $publishCfg = $config['publish'] ?? [];

        // Если задан allowed_targets — используем только его (без автоскана и static_targets)
        $allowed = (array) ($publishCfg['allowed_targets'] ?? []);
        if (!empty($allowed)) {
            $targets = [];
            foreach ($allowed as $path) {
                $normalized = self::normalizePublishPath((string) $path);
                if ($normalized === '') {
                    continue;
                }
                $targets[$normalized] = $normalized;
            }
            uksort($targets, static function (string $a, string $b): int {
                if ($a === '/') return -1;
                if ($b === '/') return 1;
                return strnatcasecmp($a, $b);
            });
            return $targets;
        }

        $targets = [];
        $static = (array) ($publishCfg['static_targets'] ?? []);
        foreach ($static as $path => $label) {
            $normalized = self::normalizePublishPath((string) $path);
            if ($normalized === '') {
                continue;
            }
            $targets[$normalized] = (string) $label;
        }

        if (($publishCfg['discover_from_root'] ?? true) && is_dir($root)) {
            $reserved = array_map('strtolower', (array) ($publishCfg['reserved_root_entries'] ?? []));
            $excludedNames = array_map('strtolower', (array) ($publishCfg['discover_excluded_names'] ?? []));
            $discoverDepth = max(1, (int) ($publishCfg['discover_depth'] ?? 2));
            $items = scandir($root);
            if (is_array($items)) {
                foreach ($items as $item) {
                    if ($item === '.' || $item === '..' || self::startsWith($item, '.')) {
                        continue;
                    }
                    if (in_array(strtolower($item), $reserved, true)) {
                        continue;
                    }
                    if (in_array(strtolower($item), $excludedNames, true)) {
                        continue;
                    }

                    $abs = $root . '/' . $item;
                    if (!is_dir($abs)) {
                        continue;
                    }

                    $path = '/' . $item . '/';
                    if (!isset($targets[$path])) {
                        $targets[$path] = $path;
                    }

                    if ($discoverDepth < 2) {
                        continue;
                    }

                    $subItems = scandir($abs);
                    if (!is_array($subItems)) {
                        continue;
                    }

                    foreach ($subItems as $subItem) {
                        if ($subItem === '.' || $subItem === '..' || self::startsWith($subItem, '.')) {
                            continue;
                        }
                        if (in_array(strtolower($subItem), $excludedNames, true)) {
                            continue;
                        }

                        $subAbs = $abs . '/' . $subItem;
                        if (!is_dir($subAbs)) {
                            continue;
                        }

                        $subPath = '/' . $item . '/' . $subItem . '/';
                        if (!isset($targets[$subPath])) {
                            $targets[$subPath] = $subPath;
                        }
                    }
                }
            }
        }

        if (!isset($targets['/'])) {
            $targets['/'] = 'Корень сайта (/)';
        }

        uksort($targets, static function (string $a, string $b): int {
            if ($a === '/') {
                return -1;
            }
            if ($b === '/') {
                return 1;
            }
            return strnatcasecmp($a, $b);
        });

        return $targets;
    }

    public static function normalizePublishPath(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return '';
        }

        $path = str_replace('\\', '/', $path);
        $path = preg_replace('~/{2,}~', '/', $path) ?: '';

        if (!self::startsWith($path, '/')) {
            $path = '/' . $path;
        }

        if (strpos($path, '..') !== false) {
            return '';
        }

        if (!preg_match('~^/[A-Za-z0-9_\-/]*$~', $path)) {
            return '';
        }

        if ($path !== '/' && !self::endsWith($path, '/')) {
            $path .= '/';
        }

        return $path;
    }

    public function run(string $zipFilePath, string $targetPath, array $options = []): array
    {
        $started = microtime(true);
        $transformMode = $this->resolveTransformMode($options);
        $applyWebp = $transformMode >= 2;
        $applyMinify = $transformMode === 3;
        $timings = [
            'extract_zip' => 0.0,
            'prepare_build' => 0.0,
            'minify_css_js' => 0.0,
            'convert_images' => 0.0,
            'replace_references' => 0.0,
            'minify_html' => 0.0,
            'publish' => 0.0,
        ];

        $report = [
            'request_id' => function_exists('adminCarrdRequestId') ? adminCarrdRequestId() : bin2hex(random_bytes(8)),
            'status' => 'error',
            'started_at' => date('Y-m-d H:i:s'),
            'finished_at' => null,
            'duration_sec' => 0,
            'target_path' => $targetPath,
            'transform_mode' => $transformMode,
            'transform_mode_label' => $this->transformModeLabel($transformMode),
            'webp_enabled' => $applyWebp,
            'minify_enabled' => $applyMinify,
            'published_abs_path' => null,
            'published_url' => null,
            'images_converted' => 0,
            'images_failed' => 0,
            'references_updated' => 0,
            'files' => [
                'css' => ['before' => 0, 'after' => 0],
                'js' => ['before' => 0, 'after' => 0],
                'html' => ['before' => 0, 'after' => 0],
            ],
            'timings_sec' => [],
            'warnings' => [],
            'errors' => [],
            'runtime' => [],
            'stages' => [],
        ];

        $jobDir = $this->tmpDir . '/job_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4));
        $extractDir = $jobDir . '/extracted';
        $buildDir = $jobDir . '/build';

        $this->ensureDir($extractDir);
        $this->ensureDir($buildDir);

        try {
            $report['runtime'] = $this->applyRuntimeLimits();
            if (!empty($report['runtime']['warning'])) {
                $report['warnings'][] = (string) $report['runtime']['warning'];
            }

            $this->sweepOldBackups();

            $allowedTargets = self::getPublishTargets($this->config);
            $targetPath = self::normalizePublishPath($targetPath);
            if ($targetPath === '' || !isset($allowedTargets[$targetPath])) {
                throw new RuntimeException('Выбранный путь публикации не разрешён.');
            }
            $report['target_path'] = $targetPath;

            $stageStarted = microtime(true);
            $this->safeExtractZip($zipFilePath, $extractDir);
            $timings['extract_zip'] = round(microtime(true) - $stageStarted, 4);
            $report['stages']['extract_zip'] = ['status' => 'done', 'duration_sec' => $timings['extract_zip']];

            $stageStarted = microtime(true);
            $sourceRoot = $this->locateProjectRoot($extractDir);
            $this->copyDirectory($sourceRoot, $buildDir);
            $this->assertRequiredStructure($buildDir);
            $timings['prepare_build'] = round(microtime(true) - $stageStarted, 4);
            $report['stages']['prepare_build'] = ['status' => 'done', 'duration_sec' => $timings['prepare_build']];

            $cssPath = $buildDir . '/assets/main.css';
            $jsPath = $buildDir . '/assets/main.js';
            $htmlPath = $buildDir . '/index.html';

            $report['files']['css']['before'] = filesize($cssPath) ?: 0;
            $report['files']['js']['before'] = filesize($jsPath) ?: 0;
            $report['files']['html']['before'] = filesize($htmlPath) ?: 0;

            $css = $this->readFile($cssPath);
            $js = $this->readFile($jsPath);
            $html = $this->readFile($htmlPath);

            $applyHtmlMinify = $applyMinify && (bool) ($this->config['optimizer']['html_minify_enabled'] ?? false);

            if ($applyMinify) {
                $stageStarted = microtime(true);
                $this->writeFile($cssPath, $this->minifyCss($css));
                $minifyWarnings = [];
                $this->writeFile($jsPath, $this->minifyJsWithFallback($js, $minifyWarnings));
                $report['warnings'] = array_merge($report['warnings'], $minifyWarnings);
                $timings['minify_css_js'] = round(microtime(true) - $stageStarted, 4);
            }
            $report['stages']['minify_css_js'] = ['status' => $applyMinify ? 'done' : 'skipped', 'duration_sec' => $timings['minify_css_js']];

            if ($applyWebp) {
                $stageStarted = microtime(true);
                $conversion = $this->convertImagesToWebp($buildDir, basename($jobDir));
                $timings['convert_images'] = round(microtime(true) - $stageStarted, 4);
                $report['images_converted'] = $conversion['converted'];
                $report['images_failed'] = $conversion['failed'];
                $report['warnings'] = array_merge($report['warnings'], $conversion['warnings']);
                if (!empty($conversion['backup_dir'])) {
                    $report['originals_backup_dir'] = $conversion['backup_dir'];
                }

                $referenceMap = $conversion['map'];
                if (!empty($referenceMap)) {
                    $stageStarted = microtime(true);
                    $replaceCount = 0;
                    $replaceCount += $this->replaceImageReferencesInFile($htmlPath, '', $referenceMap);
                    $replaceCount += $this->replaceImageReferencesInFile($cssPath, 'assets', $referenceMap);
                    $replaceCount += $this->replaceImageReferencesInFile($jsPath, 'assets', $referenceMap);
                    $report['references_updated'] = $replaceCount;
                    $timings['replace_references'] = round(microtime(true) - $stageStarted, 4);
                }
            }
            $report['stages']['convert_images'] = ['status' => $applyWebp ? 'done' : 'skipped', 'duration_sec' => $timings['convert_images']];
            $report['stages']['replace_references'] = ['status' => $applyWebp ? 'done' : 'skipped', 'duration_sec' => $timings['replace_references']];

            if ($applyHtmlMinify) {
                $stageStarted = microtime(true);
                $html = $this->readFile($htmlPath);
                $this->writeFile($htmlPath, $this->minifyHtml($html));
                $timings['minify_html'] = round(microtime(true) - $stageStarted, 4);
            }
            $report['stages']['minify_html'] = ['status' => $applyHtmlMinify ? 'done' : 'skipped', 'duration_sec' => $timings['minify_html']];

            $report['files']['css']['after'] = filesize($cssPath) ?: 0;
            $report['files']['js']['after'] = filesize($jsPath) ?: 0;
            $report['files']['html']['after'] = filesize($htmlPath) ?: 0;

            $stageStarted = microtime(true);
            $publishResult = $this->publish($buildDir, $targetPath);
            $timings['publish'] = round(microtime(true) - $stageStarted, 4);
            $report['published_abs_path'] = $publishResult['abs_path'];
            $report['published_url'] = $publishResult['url_path'];
            if (!empty($publishResult['backup_retained_path'])) {
                $report['publish_backup_retained_path'] = $publishResult['backup_retained_path'];
            }
            $report['stages']['publish'] = ['status' => 'done', 'duration_sec' => $timings['publish']];

            $report['status'] = 'success';
        } catch (\Throwable $e) {
            $report['status'] = 'error';
            $report['errors'][] = $e->getMessage();
        } finally {
            if (is_file($zipFilePath)) {
                @unlink($zipFilePath);
            }

            $this->removeDirectory($jobDir);

            $report['finished_at'] = date('Y-m-d H:i:s');
            $report['duration_sec'] = round(microtime(true) - $started, 2);
            $report['timings_sec'] = $timings;
            $this->writeLog($report);
        }

        return $report;
    }

    private function resolveTransformMode(array $options): int
    {
        if (array_key_exists('transform_mode', $options)) {
            $mode = (int) $options['transform_mode'];
            if (in_array($mode, [1, 2, 3], true)) {
                return $mode;
            }
        }

        if (array_key_exists('minify_enabled', $options)) {
            return (bool) $options['minify_enabled'] ? 3 : 2;
        }

        $configMode = (int) ($this->config['optimizer']['transform_mode_default'] ?? 0);
        if (in_array($configMode, [1, 2, 3], true)) {
            return $configMode;
        }

        return (bool) ($this->config['optimizer']['minify_enabled_default'] ?? true) ? 3 : 2;
    }

    private function transformModeLabel(int $mode): string
    {
        if ($mode === 1) {
            return 'Только размещение (без преобразований)';
        }
        if ($mode === 2) {
            return 'WebP без минификации';
        }
        return 'WebP + минификация CSS/JS';
    }

    private function safeExtractZip(string $zipPath, string $extractDir)
    {
        if (!is_file($zipPath)) {
            throw new RuntimeException('Архив не найден во временном каталоге.');
        }

        $zip = new ZipArchive();
        $opened = $zip->open($zipPath);
        if ($opened !== true) {
            throw new RuntimeException('Не удалось открыть ZIP-архив.');
        }

        if ($zip->numFiles < 1) {
            $zip->close();
            throw new RuntimeException('ZIP-архив пустой.');
        }

        $maxUnpackedBytes = max(
            (int) (($this->config['upload']['max_bytes'] ?? 100 * 1024 * 1024) * 5),
            500 * 1024 * 1024
        );

        $totalUnpacked = 0;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if (!is_array($stat)) {
                continue;
            }

            $name = (string) ($stat['name'] ?? '');
            if ($name === '') {
                continue;
            }

            $isDir = self::endsWith($name, '/');
            $safeRelative = $this->normalizeZipEntryPath($name, $isDir);
            if ($safeRelative === '') {
                continue;
            }

            $mode = (($stat['external_attributes'] ?? 0) >> 16) & 0xF000;
            if ($mode === 0xA000) {
                throw new RuntimeException('Обнаружена символьная ссылка в архиве: ' . $name);
            }

            $dest = $extractDir . '/' . $safeRelative;
            if ($isDir) {
                $this->ensureDir($dest);
                continue;
            }

            $size = (int) ($stat['size'] ?? 0);
            if ($size < 0) {
                $size = 0;
            }
            $totalUnpacked += $size;
            if ($totalUnpacked > $maxUnpackedBytes) {
                throw new RuntimeException('Архив слишком большой после распаковки (возможен zip bomb).');
            }

            $destDir = dirname($dest);
            $this->ensureDir($destDir);

            $stream = $zip->getStream($name);
            if ($stream === false) {
                throw new RuntimeException('Не удалось прочитать файл из архива: ' . $name);
            }

            $out = fopen($dest, 'wb');
            if ($out === false) {
                fclose($stream);
                throw new RuntimeException('Не удалось создать файл: ' . $safeRelative);
            }

            // Защита от подделки stat['size']: копируем кусками с проверкой суммарного объёма.
            // Если фактическое содержимое больше заявленного — отбрасываем как zip bomb.
            $remainingBudget = $maxUnpackedBytes - ($totalUnpacked - $size);
            $written = 0;
            $chunkSize = 1 << 20; // 1 MiB
            while (!feof($stream)) {
                $buf = fread($stream, $chunkSize);
                if ($buf === false) {
                    break;
                }
                $bufLen = strlen($buf);
                if ($bufLen === 0) {
                    break;
                }
                $written += $bufLen;
                if ($written > $remainingBudget) {
                    fclose($stream);
                    fclose($out);
                    @unlink($dest);
                    throw new RuntimeException('Архив слишком большой после распаковки (возможен zip bomb).');
                }
                fwrite($out, $buf);
            }
            fclose($stream);
            fclose($out);

            // Корректируем суммарный объём — берём фактическое значение.
            $totalUnpacked = ($totalUnpacked - $size) + $written;
        }

        $zip->close();
    }

    private function normalizeZipEntryPath(string $path, bool $isDir): string
    {
        $path = str_replace('\\', '/', $path);
        $path = ltrim($path, '/');

        if ($path === '' || strpos($path, "\0") !== false || preg_match('~^[A-Za-z]:~', $path)) {
            throw new RuntimeException('Недопустимый путь в ZIP-архиве.');
        }

        $parts = [];
        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                throw new RuntimeException('Path traversal в ZIP-архиве запрещён.');
            }
            $parts[] = $part;
        }

        if (empty($parts)) {
            return '';
        }

        $normalized = implode('/', $parts);
        if ($isDir && !self::endsWith($normalized, '/')) {
            $normalized .= '/';
        }

        return rtrim($normalized, '/');
    }

    private function locateProjectRoot(string $extractDir): string
    {
        $candidates = [$extractDir];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($extractDir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            if (!$item->isDir()) {
                continue;
            }

            if ($iterator->getDepth() > 3) {
                continue;
            }

            $candidates[] = $item->getPathname();
        }

        foreach ($candidates as $candidate) {
            if ($this->hasRequiredStructure($candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException('В архиве не найдена валидная структура (index.html + assets/main.css + assets/main.js).');
    }

    private function assertRequiredStructure(string $root)
    {
        if (!$this->hasRequiredStructure($root)) {
            throw new RuntimeException('После распаковки/копирования структура проекта невалидна.');
        }
    }

    private function hasRequiredStructure(string $root): bool
    {
        $required = (array) ($this->config['optimizer']['require_files'] ?? []);
        foreach ($required as $rel) {
            $file = $root . '/' . ltrim((string) $rel, '/');
            if (!is_file($file)) {
                return false;
            }
        }

        return is_dir($root . '/assets');
    }

    private function convertImagesToWebp(string $buildDir, string $jobId): array
    {
        $assetsDir = $buildDir . '/assets';
        if (!is_dir($assetsDir)) {
            return [
                'converted' => 0,
                'failed' => 0,
                'warnings' => ['Каталог assets не найден для конвертации изображений.'],
                'map' => [],
                'backup_dir' => null,
            ];
        }

        $quality = (int) ($this->config['optimizer']['webp_quality'] ?? 85);
        $deleteOriginal = (bool) ($this->config['optimizer']['delete_original_images'] ?? true);
        $keepBackup = $deleteOriginal && (bool) ($this->config['optimizer']['keep_original_images_backup'] ?? false);
        $backupDir = $keepBackup ? ($this->originalBackupsDir . '/' . $jobId) : null;
        if ($backupDir !== null) {
            $this->ensureDir($backupDir);
        }

        $map = [];
        $converted = 0;
        $failed = 0;
        $warnings = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($assetsDir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }

            $ext = strtolower($file->getExtension());
            if (!in_array($ext, ['png', 'jpg', 'jpeg'], true)) {
                continue;
            }

            $src = $file->getPathname();
            $dst = preg_replace('~\.(png|jpe?g)$~i', '.webp', $src) ?: ($src . '.webp');

            $ok = $this->convertImageToWebp($src, $dst, $quality);
            if (!$ok) {
                $failed++;
                $warnings[] = 'Не удалось конвертировать изображение: ' . $this->relativePath($buildDir, $src);
                continue;
            }

            $relOld = $this->relativePath($buildDir, $src);
            $relNew = $this->relativePath($buildDir, $dst);
            $map[strtolower($relOld)] = $relNew;

            if ($deleteOriginal) {
                if ($backupDir !== null) {
                    $backupTarget = $backupDir . '/' . $relOld;
                    $this->ensureDir(dirname($backupTarget));
                    @copy($src, $backupTarget);
                }
                @unlink($src);
            }

            $converted++;
        }

        return [
            'converted' => $converted,
            'failed' => $failed,
            'warnings' => $warnings,
            'map' => $map,
            'backup_dir' => $backupDir,
        ];
    }

    private function convertImageToWebp(string $src, string $dst, int $quality): bool
    {
        if (extension_loaded('imagick')) {
            try {
                $img = new \Imagick();
                $img->readImage($src);
                $img->setImageFormat('webp');
                $img->setImageCompressionQuality($quality);
                $result = $img->writeImage($dst);
                $img->clear();
                $img->destroy();

                return $result && is_file($dst);
            } catch (\Throwable $e) {
                // Fallback на GD.
            }
        }

        if (!function_exists('imagewebp')) {
            return false;
        }

        $imageInfo = @getimagesize($src);
        if (!is_array($imageInfo)) {
            return false;
        }

        $type = (int) ($imageInfo[2] ?? 0);
        $resource = null;

        if ($type === IMAGETYPE_JPEG) {
            $resource = @imagecreatefromjpeg($src);
        } elseif ($type === IMAGETYPE_PNG) {
            $resource = @imagecreatefrompng($src);
            if ($resource !== false) {
                imagepalettetotruecolor($resource);
                imagealphablending($resource, true);
                imagesavealpha($resource, true);
            }
        } else {
            return false;
        }

        if ($resource === false || $resource === null) {
            return false;
        }

        $ok = imagewebp($resource, $dst, $quality);
        imagedestroy($resource);

        return $ok && is_file($dst);
    }

    private function replaceImageReferencesInFile(string $filePath, string $currentDir, array $map): int
    {
        $content = $this->readFile($filePath);
        $contentLower = strtolower($content);
        if (
            strpos($contentLower, '.png') === false &&
            strpos($contentLower, '.jpg') === false &&
            strpos($contentLower, '.jpeg') === false
        ) {
            return 0;
        }

        $replaced = 0;
        $pathCache = [];
        $occurrences = $this->findImageReferenceOccurrences($content);
        if (!count($occurrences)) {
            return 0;
        }

        $newContent = '';
        $cursor = 0;
        $contentLength = strlen($content);

        foreach ($occurrences as $item) {
            $start = (int) ($item['full_start'] ?? 0);
            $len = (int) ($item['full_len'] ?? 0);
            $path = (string) ($item['path'] ?? '');
            $suffix = (string) ($item['suffix'] ?? '');

            if ($len <= 0 || $start < $cursor || $start > $contentLength) {
                continue;
            }

            $newContent .= substr($content, $cursor, $start - $cursor);
            $original = substr($content, $start, $len);
            $replacement = $original;

            if ($path !== '') {
                $lowerPath = strtolower($path);
                if (
                    !self::startsWith($lowerPath, 'http://') &&
                    !self::startsWith($lowerPath, 'https://') &&
                    !self::startsWith($lowerPath, '//') &&
                    !self::startsWith($lowerPath, 'data:') &&
                    !self::startsWith($lowerPath, 'blob:')
                ) {
                    if (array_key_exists($path, $pathCache)) {
                        $resolvedKey = $pathCache[$path];
                    } else {
                        $resolvedKey = null;
                        $candidates = $this->resolveReferenceCandidates($currentDir, $path);
                        foreach ($candidates as $candidate) {
                            $candidateKey = strtolower($candidate);
                            if (isset($map[$candidateKey])) {
                                $resolvedKey = $candidateKey;
                                break;
                            }
                        }
                        $pathCache[$path] = $resolvedKey;
                    }

                    if ($resolvedKey !== null) {
                        $newPath = $this->replaceImageExtensionWithWebp($path);
                        if ($newPath !== $path) {
                            $replacement = $newPath . $suffix;
                            $replaced++;
                        }
                    }
                }
            }

            $newContent .= $replacement;
            $cursor = $start + $len;
        }

        if ($cursor < $contentLength) {
            $newContent .= substr($content, $cursor);
        }

        if ($newContent !== $content) {
            $this->writeFile($filePath, $newContent);
        }

        return $replaced;
    }

    private function findImageReferenceOccurrences(string $content): array
    {
        $occurrences = [];
        $length = strlen($content);
        if ($length === 0) {
            return $occurrences;
        }

        $lower = strtolower($content);
        $offset = 0;

        while (true) {
            [$extPos, $extLen] = $this->findNextImageExtension($lower, $offset);
            if ($extPos < 0) {
                break;
            }

            $extEnd = $extPos + $extLen;
            $offset = $extEnd;

            $nextChar = $extEnd < $length ? $content[$extEnd] : '';
            if ($nextChar !== '' && $nextChar !== '?' && $nextChar !== '#' && $this->isImageReferencePathChar($nextChar)) {
                continue;
            }

            $pathStart = $extPos;
            while ($pathStart > 0) {
                $char = $content[$pathStart - 1];
                if (!$this->isImageReferencePathChar($char)) {
                    break;
                }
                $pathStart--;
            }

            if ($pathStart >= $extPos) {
                continue;
            }

            $path = substr($content, $pathStart, $extEnd - $pathStart);
            if ($path === '') {
                continue;
            }

            $suffixEnd = $extEnd;
            if ($suffixEnd < $length && $content[$suffixEnd] === '?') {
                $suffixEnd++;
                while ($suffixEnd < $length && $this->isImageReferenceSuffixChar($content[$suffixEnd])) {
                    $suffixEnd++;
                }
            }
            if ($suffixEnd < $length && $content[$suffixEnd] === '#') {
                $suffixEnd++;
                while ($suffixEnd < $length && $this->isImageReferenceSuffixChar($content[$suffixEnd])) {
                    $suffixEnd++;
                }
            }

            $suffix = $suffixEnd > $extEnd ? substr($content, $extEnd, $suffixEnd - $extEnd) : '';
            $occurrences[] = [
                'full_start' => $pathStart,
                'full_len' => $suffixEnd - $pathStart,
                'path' => $path,
                'suffix' => $suffix,
            ];
            $offset = max($offset, $suffixEnd);
        }

        return $occurrences;
    }

    private function findNextImageExtension(string $lowerContent, int $offset): array
    {
        $pos = -1;
        $len = 0;

        $extensions = [
            '.png' => 4,
            '.jpg' => 4,
            '.jpeg' => 5,
        ];

        foreach ($extensions as $needle => $needleLen) {
            $candidate = strpos($lowerContent, $needle, $offset);
            if ($candidate === false) {
                continue;
            }
            if ($pos === -1 || $candidate < $pos) {
                $pos = $candidate;
                $len = $needleLen;
            }
        }

        return [$pos, $len];
    }

    private function isImageReferencePathChar(string $char): bool
    {
        if ($char === '') {
            return false;
        }

        if (ord($char) <= 32) {
            return false;
        }

        return !in_array($char, ['"', "'", '`', '(', ')', '<', '>', '{', '}', '[', ']', ',', ';', '=', '?', '#'], true);
    }

    private function isImageReferenceSuffixChar(string $char): bool
    {
        if ($char === '') {
            return false;
        }

        if (ord($char) <= 32) {
            return false;
        }

        return !in_array($char, ['"', "'", '`', '(', ')', '<', '>', '{', '}', '[', ']', ',', ';'], true);
    }

    private function replaceImageExtensionWithWebp(string $path): string
    {
        $pathLower = strtolower($path);
        if (self::endsWith($pathLower, '.png') || self::endsWith($pathLower, '.jpg')) {
            return substr($path, 0, -4) . '.webp';
        }
        if (self::endsWith($pathLower, '.jpeg')) {
            return substr($path, 0, -5) . '.webp';
        }

        return $path;
    }

    private function resolveReferenceCandidates(string $currentDir, string $path): array
    {
        $path = trim($path);
        if ($path === '') {
            return [];
        }

        $path = str_replace('\\', '/', $path);
        $candidates = [];

        if (self::startsWith($path, '/')) {
            $resolved = $this->normalizePath(ltrim($path, '/'));
            if ($resolved !== '') {
                $candidates[] = $resolved;
            }
            return $candidates;
        }

        $base = trim($currentDir, '/');
        $combined = $base === '' ? $path : ($base . '/' . $path);
        $resolved = $this->normalizePath($combined);
        if ($resolved !== '') {
            $candidates[] = $resolved;
        }

        $fallback = $this->normalizePath(ltrim($path, './'));
        if ($fallback !== '' && !in_array($fallback, $candidates, true)) {
            $candidates[] = $fallback;
        }

        return $candidates;
    }

    private function normalizePath(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $parts = [];

        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                if (empty($parts)) {
                    return '';
                }
                array_pop($parts);
                continue;
            }
            $parts[] = $part;
        }

        return implode('/', $parts);
    }

    private function publish(string $buildDir, string $targetPath): array
    {
        if ($targetPath === '/') {
            return $this->publishToRoot($buildDir);
        }

        $targetAbs = $this->projectRoot . rtrim($targetPath, '/');
        if (is_file($targetAbs)) {
            throw new RuntimeException('Целевой путь указывает на файл, а не каталог: ' . $targetPath);
        }

        // Atomic-ish стратегия: backup -> copy -> на успех rm backup, на ошибку rollback.
        $backupPath = $targetAbs . '.bak.' . date('Ymd_His') . '_' . bin2hex(random_bytes(3));
        $hadBackup = false;

        if (is_dir($targetAbs)) {
            if (!@rename($targetAbs, $backupPath)) {
                // rename не удался (FS межтомный?) — fallback на старое поведение с предупреждением.
                $this->removeDirectory($targetAbs);
            } else {
                $hadBackup = true;
            }
        }

        try {
            $this->ensureDir($targetAbs);
            $this->copyDirectory($buildDir, $targetAbs);
        } catch (\Throwable $e) {
            // Rollback: убираем недокопированное, возвращаем backup на место.
            $this->removeDirectory($targetAbs);
            if ($hadBackup && is_dir($backupPath)) {
                @rename($backupPath, $targetAbs);
            }
            throw $e;
        }

        $retainedBackupPath = null;
        if ($hadBackup && is_dir($backupPath)) {
            if ((bool) ($this->config['publish']['keep_publish_backup'] ?? false)) {
                $retainedBackupPath = $this->retainPublishBackup($backupPath, $targetPath);
            } else {
                $this->removeDirectory($backupPath);
            }
        }

        return [
            'abs_path' => $targetAbs,
            'url_path' => $targetPath,
            'backup_retained_path' => $retainedBackupPath,
        ];
    }

    private function publishToRoot(string $buildDir): array
    {
        $reserved = array_map('strtolower', (array) ($this->config['publish']['reserved_root_entries'] ?? []));
        $protectedFiles = array_map('strtolower', (array) ($this->config['publish']['protected_root_files'] ?? []));
        $backupRoot = $this->publishBackupsDir . '/root__' . date('Ymd_His') . '_' . bin2hex(random_bytes(3));
        $hadBackup = false;
        $processed = [];

        $items = scandir($buildDir);
        if (!is_array($items)) {
            throw new RuntimeException('Ошибка публикации: не удалось прочитать временный build-каталог.');
        }

        try {
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') {
                    continue;
                }

                if (self::startsWith($item, '.')) {
                    throw new RuntimeException('Публикация dotfile в корень запрещена: ' . $item);
                }

                if (in_array(strtolower($item), $protectedFiles, true)) {
                    throw new RuntimeException('Публикация защищённого корневого файла запрещена: ' . $item);
                }

                if (in_array(strtolower($item), $reserved, true)) {
                    throw new RuntimeException('Нельзя публиковать в корень файл/каталог с зарезервированным именем: ' . $item);
                }

                $dest = $this->projectRoot . '/' . $item;
                $src = $buildDir . '/' . $item;
                $backupDest = $backupRoot . '/' . $item;

                if (is_dir($dest) || is_file($dest)) {
                    $this->ensureDir(dirname($backupDest));
                    if (!@rename($dest, $backupDest)) {
                        if (is_dir($dest)) {
                            $this->copyDirectory($dest, $backupDest);
                            $this->removeDirectory($dest);
                        } else {
                            $this->copyFile($dest, $backupDest);
                            @unlink($dest);
                        }
                    }
                    $hadBackup = true;
                }

                if (is_dir($src)) {
                    $this->copyDirectory($src, $dest);
                } else {
                    $this->copyFile($src, $dest);
                }
                $processed[] = $dest;
            }
        } catch (\Throwable $e) {
            foreach (array_reverse($processed) as $dest) {
                if (is_dir($dest)) {
                    $this->removeDirectory($dest);
                } elseif (is_file($dest)) {
                    @unlink($dest);
                }
            }
            if ($hadBackup && is_dir($backupRoot)) {
                $backupItems = scandir($backupRoot);
                if (is_array($backupItems)) {
                    foreach ($backupItems as $backupItem) {
                        if ($backupItem === '.' || $backupItem === '..') {
                            continue;
                        }
                        $from = $backupRoot . '/' . $backupItem;
                        $to = $this->projectRoot . '/' . $backupItem;
                        if (!@rename($from, $to)) {
                            if (is_dir($from)) {
                                $this->copyDirectory($from, $to);
                                $this->removeDirectory($from);
                            } else {
                                $this->copyFile($from, $to);
                                @unlink($from);
                            }
                        }
                    }
                }
            }
            throw $e;
        }

        $retainedBackupPath = null;
        if ($hadBackup && is_dir($backupRoot)) {
            if ((bool) ($this->config['publish']['keep_publish_backup'] ?? false)) {
                $retainedBackupPath = $backupRoot;
            } else {
                $this->removeDirectory($backupRoot);
            }
        }

        return [
            'abs_path' => $this->projectRoot,
            'url_path' => '/',
            'backup_retained_path' => $retainedBackupPath,
        ];
    }

    private function minifyCss(string $css): string
    {
        // Безопасная минификация: не трогаем арифметику в calc()/clamp(), где пробелы значимы.
        $css = preg_replace('!/\*.*?\*/!s', '', $css) ?? $css;
        $css = preg_replace('/[ \t\r\n\f]+/', ' ', $css) ?? $css;
        $css = preg_replace('/[ \t\r\n\f]*([{}:;,>~])[ \t\r\n\f]*/', '$1', $css) ?? $css;
        $css = str_replace(';}', '}', $css);
        return trim($css);
    }

    private function minifyJsSafe(string $js): string
    {
        $out = '';
        $len = strlen($js);
        $state = 'normal';

        for ($i = 0; $i < $len; $i++) {
            $ch = $js[$i];
            $next = $i + 1 < $len ? $js[$i + 1] : '';

            if ($state === 'normal') {
                // Строки: одинарные, двойные кавычки и backticks
                if ($ch === "'" || $ch === '"' || $ch === '`') {
                    $state = $ch;
                    $out .= $ch;
                    continue;
                }

                // Многострочный комментарий /* ... */
                if ($ch === '/' && $next === '*') {
                    $state = 'block_comment';
                    $i++;
                    continue;
                }

                // Однострочный комментарий // ...
                if ($ch === '/' && $next === '/') {
                    $state = 'line_comment';
                    $i++;
                    continue;
                }

                $out .= $ch;
                continue;
            }

            // Обработка многострочного комментария
            if ($state === 'block_comment') {
                if ($ch === '*' && $next === '/') {
                    $state = 'normal';
                    $i++;
                }
                continue;
            }

            // Обработка однострочного комментария
            if ($state === 'line_comment') {
                if ($ch === "\n" || $ch === "\r") {
                    $state = 'normal';
                    $out .= "\n"; // Сохраняем перенос строки
                }
                continue;
            }

            // Обработка строк с экранированием
            $out .= $ch;
            if ($ch === '\\') {
                $i++;
                if ($i < $len) {
                    $out .= $js[$i];
                }
                continue;
            }

            // Закрытие строки (выход из состояния)
            if ($state === $ch) {
                $state = 'normal';
            }
        }

        // Нормализация переносов строк
        $out = str_replace(["\r\n", "\r"], "\n", $out);
        return $this->joinTrimmedLines($out, "\n");
    }

    private function minifyJsWithFallback(string $js, array &$warnings): string
    {
        $mode = (string) ($this->config['optimizer']['js_minify_mode'] ?? 'conservative');
        if ($mode !== 'conservative') {
            return $this->minifyJsSafe($js);
        }

        if ($this->looksRiskyForNaiveJsMinifier($js)) {
            $warnings[] = 'Минификация JS пропущена: код содержит шаблоны, которые могут быть небезопасны для упрощённого минификатора.';
            return $js;
        }

        return $this->minifyJsSafe($js);
    }

    private function looksRiskyForNaiveJsMinifier(string $js): bool
    {
        $patterns = [
            '~(^|[=(:,\[]\s*)/(?![/*])~',
            '~return\s+/(?![/*])~',
            '~=>\s*/(?![/*])~',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $js)) {
                return true;
            }
        }

        return false;
    }

    private function minifyHtml(string $html): string
    {
        // Удаляем HTML комментарии (кроме условных комментариев IE)
        $html = preg_replace('/<!--(?!\[if).*?-->/s', '', $html) ?? $html;

        // КРИТИЧНО: Минифицируем содержимое <script> тегов ПЕРЕД склейкой HTML
        // Это удаляет однострочные комментарии //, которые иначе сломают код
        $html = preg_replace_callback(
            '/<script([^>]*)>(.*?)<\/script>/si',
            function (array $matches): string {
                $attributes = $matches[1] ?? '';
                $scriptContent = $matches[2] ?? '';

                // Пропускаем внешние скрипты (с src="...")
                if (preg_match('/\bsrc\s*=/', $attributes)) {
                    return $matches[0];
                }

                // Пропускаем пустые скрипты
                if (trim($scriptContent) === '') {
                    return $matches[0];
                }

                // Минифицируем JavaScript (удаляем комментарии)
                $minified = $this->minifyJsSafe($scriptContent);
                if ($this->looksRiskyForNaiveJsMinifier($scriptContent)) {
                    return '<script' . $attributes . '>' . $scriptContent . '</script>';
                }

                return '<script' . $attributes . '>' . $minified . '</script>';
            },
            $html
        ) ?? $html;

        // Удаляем пробелы между тегами
        $html = preg_replace('/>[ \t\r\n\f]+</', '><', $html) ?? $html;

        // Склеиваем строки (теперь безопасно, т.к. // комментарии удалены)
        $html = str_replace(["\r\n", "\r"], "\n", $html);
        return $this->joinTrimmedLines($html, '');
    }

    private function joinTrimmedLines(string $text, string $glue): string
    {
        $result = '';
        $offset = 0;
        $length = strlen($text);
        $first = true;

        while ($offset <= $length) {
            $nextPos = strpos($text, "\n", $offset);
            if ($nextPos === false) {
                $line = substr($text, $offset);
                $offset = $length + 1;
            } else {
                $line = substr($text, $offset, $nextPos - $offset);
                $offset = $nextPos + 1;
            }

            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (!$first) {
                $result .= $glue;
            }

            $result .= $line;
            $first = false;
        }

        return $result;
    }

    private function copyDirectory(string $from, string $to)
    {
        if (!is_dir($from)) {
            throw new RuntimeException('Каталог для копирования не найден: ' . $from);
        }

        $this->ensureDir($to);

        $items = scandir($from);
        if (!is_array($items)) {
            throw new RuntimeException('Не удалось прочитать каталог: ' . $from);
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $src = $from . '/' . $item;
            $dst = $to . '/' . $item;

            if (is_dir($src)) {
                $this->copyDirectory($src, $dst);
            } else {
                $this->copyFile($src, $dst);
            }
        }
    }

    private function copyFile(string $src, string $dst)
    {
        $this->ensureDir(dirname($dst));

        if (!@copy($src, $dst)) {
            throw new RuntimeException('Не удалось скопировать файл: ' . $src);
        }
    }

    private function removeDirectory(string $dir)
    {
        if (!is_dir($dir)) {
            return;
        }

        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($it as $item) {
            $path = $item->getPathname();
            if ($item->isDir()) {
                @rmdir($path);
            } else {
                @unlink($path);
            }
        }

        @rmdir($dir);
    }

    private function ensureDir(string $dir)
    {
        if (is_dir($dir)) {
            return;
        }

        if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('Не удалось создать каталог: ' . $dir);
        }
    }

    private function writeLog(array $report)
    {
        $file = $this->logsDir . '/' . date('Y-m-d') . '.log';

        $entry = [
            'request_id' => $report['request_id'] ?? '',
            'time' => date('c'),
            'status' => $report['status'] ?? 'error',
            'target_path' => $report['target_path'] ?? '',
            'duration_sec' => $report['duration_sec'] ?? 0,
            'timings_sec' => $report['timings_sec'] ?? [],
            'stages' => $report['stages'] ?? [],
            'runtime' => $report['runtime'] ?? [],
            'images_converted' => $report['images_converted'] ?? 0,
            'images_failed' => $report['images_failed'] ?? 0,
            'warnings_count' => count((array) ($report['warnings'] ?? [])),
            'warnings' => $report['warnings'] ?? [],
            'errors_count' => count((array) ($report['errors'] ?? [])),
            'errors' => $report['errors'] ?? [],
        ];

        @file_put_contents($file, json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }

    private function applyRuntimeLimits(): array
    {
        $targetTimeout = (int) ($this->config['optimizer']['target_timeout_sec'] ?? 120);
        $initialMaxExecutionTime = (int) ini_get('max_execution_time');
        $effectiveMaxExecutionTime = $initialMaxExecutionTime;
        $setTimeLimitResult = null;
        $warning = null;

        if ($targetTimeout > 0) {
            $setTimeLimitResult = @set_time_limit($targetTimeout);
            $effectiveMaxExecutionTime = (int) ini_get('max_execution_time');
            if ($setTimeLimitResult === false) {
                $warning = 'PHP не подтвердил set_time_limit(); итоговый лимит выполнения контролируется окружением сервера.';
            } elseif ($effectiveMaxExecutionTime > 0 && $effectiveMaxExecutionTime < $targetTimeout) {
                $warning = 'Итоговый max_execution_time меньше желаемого target_timeout_sec; возможен внешний таймаут.';
            }
        }

        return [
            'target_timeout_sec' => $targetTimeout,
            'php_max_execution_time' => $effectiveMaxExecutionTime,
            'php_max_execution_time_before' => $initialMaxExecutionTime,
            'set_time_limit_result' => $setTimeLimitResult,
            'warning' => $warning,
        ];
    }

    private function sweepOldBackups(): void
    {
        $this->sweepTreeByAge(
            $this->originalBackupsDir,
            (int) ($this->config['optimizer']['original_images_backup_ttl_hours'] ?? 168)
        );
        $this->sweepTreeByAge(
            $this->publishBackupsDir,
            (int) ($this->config['publish']['publish_backup_ttl_hours'] ?? 48)
        );
    }

    private function sweepTreeByAge(string $dir, int $ttlHours): void
    {
        if ($dir === '' || !is_dir($dir) || $ttlHours <= 0) {
            return;
        }

        $threshold = time() - ($ttlHours * 3600);
        foreach (glob($dir . '/*') ?: [] as $entry) {
            $mtime = @filemtime($entry);
            if ($mtime === false || $mtime >= $threshold) {
                continue;
            }

            if (is_dir($entry)) {
                $this->removeDirectory($entry);
            } else {
                @unlink($entry);
            }
        }
    }

    private function retainPublishBackup(string $backupPath, string $targetPath): string
    {
        $label = trim($targetPath, '/');
        if ($label === '') {
            $label = 'root';
        }
        $label = str_replace('/', '__', $label);
        $dest = $this->publishBackupsDir . '/' . $label . '__' . basename($backupPath);

        if (@rename($backupPath, $dest)) {
            return $dest;
        }

        $this->copyDirectory($backupPath, $dest);
        $this->removeDirectory($backupPath);
        return $dest;
    }

    private function readFile(string $path): string
    {
        $content = @file_get_contents($path);
        if (!is_string($content)) {
            throw new RuntimeException('Не удалось прочитать файл: ' . $path);
        }

        return $content;
    }

    private function writeFile(string $path, string $content)
    {
        $result = @file_put_contents($path, $content);
        if ($result === false) {
            throw new RuntimeException('Не удалось записать файл: ' . $path);
        }
    }

    private function relativePath(string $base, string $target): string
    {
        $base = rtrim(str_replace('\\', '/', $base), '/');
        $target = str_replace('\\', '/', $target);

        if (self::startsWith($target, $base . '/')) {
            return substr($target, strlen($base) + 1);
        }

        return ltrim($target, '/');
    }

    private static function startsWith($haystack, $needle)
    {
        if ($needle === '') {
            return true;
        }
        return strpos((string) $haystack, (string) $needle) === 0;
    }

    private static function endsWith($haystack, $needle)
    {
        $haystack = (string) $haystack;
        $needle = (string) $needle;
        if ($needle === '') {
            return true;
        }
        $needleLen = strlen($needle);
        if ($needleLen > strlen($haystack)) {
            return false;
        }
        return substr($haystack, -$needleLen) === $needle;
    }
}
