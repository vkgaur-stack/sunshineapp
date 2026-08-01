<?php
// A minimal, dependency-free XLSX (Office Open XML spreadsheet) writer.
// Uses only PHP's built-in ZipArchive extension (present on virtually all
// PHP hosting, including shared cPanel — it's required by WordPress and
// most CMS platforms, so hosts enable it by default) — no Composer, no
// PhpSpreadsheet.
//
// Supports exactly what the CSR/donation reports need: multiple sheets,
// string/number cells, and a bold header row. Not a general-purpose
// spreadsheet library — if requirements grow significantly beyond this,
// switching to PhpSpreadsheet later is a reasonable upgrade path.

class SimpleXlsxWriter
{
    private array $sheets = []; // ['Name' => [ [row...], [row...] ]]
    private array $boldHeaderSheets = [];

    public function addSheet(string $name, array $rows, bool $boldFirstRow = false): void
    {
        $this->sheets[$name] = $rows;
        if ($boldFirstRow) {
            $this->boldHeaderSheets[$name] = true;
        }
    }

    private function escapeXml(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function colLetter(int $index): string
    {
        // 0-based column index -> Excel column letter (A, B, ..., Z, AA, ...)
        $letter = '';
        $index++;
        while ($index > 0) {
            $mod = ($index - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $index = intdiv($index - $mod, 26);
        }
        return $letter;
    }

    private function sheetXml(array $rows, bool $boldHeader): string
    {
        $xmlRows = '';
        foreach ($rows as $rowIndex => $row) {
            $excelRow = $rowIndex + 1;
            $cellsXml = '';
            foreach ($row as $colIndex => $value) {
                $cellRef = $this->colLetter($colIndex) . $excelRow;
                $styleAttr = ($boldHeader && $rowIndex === 0) ? ' s="1"' : '';

                if (is_numeric($value) && $value !== '' && !is_string($value)) {
                    $cellsXml .= "<c r=\"$cellRef\"$styleAttr><v>{$value}</v></c>";
                } elseif (is_numeric($value) && $value !== '') {
                    // Numeric strings (e.g. formatted amounts) — write as number.
                    $cellsXml .= "<c r=\"$cellRef\"$styleAttr><v>{$value}</v></c>";
                } else {
                    $escaped = $this->escapeXml((string) $value);
                    $cellsXml .= "<c r=\"$cellRef\"$styleAttr t=\"inlineStr\"><is><t xml:space=\"preserve\">{$escaped}</t></is></c>";
                }
            }
            $xmlRows .= "<row r=\"$excelRow\">$cellsXml</row>";
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' .
            "<sheetData>$xmlRows</sheetData></worksheet>";
    }

    // Writes the complete .xlsx file to $outputPath.
    public function save(string $outputPath): void
    {
        if (!class_exists('ZipArchive')) {
            throw new Exception('PHP ZipArchive extension is required for XLSX export but is not available on this server.');
        }

        $zip = new ZipArchive();
        $zip->open($outputPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $zip->addFromString('[Content_Types].xml', $this->contentTypesXml());
        $zip->addFromString('_rels/.rels', $this->relsXml());
        $zip->addFromString('xl/workbook.xml', $this->workbookXml());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelsXml());
        $zip->addFromString('xl/styles.xml', $this->stylesXml());

        $sheetIndex = 1;
        foreach ($this->sheets as $name => $rows) {
            $bold = $this->boldHeaderSheets[$name] ?? false;
            $zip->addFromString("xl/worksheets/sheet{$sheetIndex}.xml", $this->sheetXml($rows, $bold));
            $sheetIndex++;
        }

        $zip->close();
    }

    // Streams the file directly to the HTTP response instead of saving to
    // disk — avoids needing writable disk space on the host for exports.
    public function output(string $filename): void
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'xlsx_');
        $this->save($tmpPath);

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header('Content-Length: ' . filesize($tmpPath));
        readfile($tmpPath);
        unlink($tmpPath);
    }

    private function contentTypesXml(): string
    {
        $sheetEntries = '';
        $i = 1;
        foreach ($this->sheets as $name) {
            $sheetEntries .= "<Override PartName=\"/xl/worksheets/sheet{$i}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>";
            $i++;
        }
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' .
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' .
            '<Default Extension="xml" ContentType="application/xml"/>' .
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' .
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' .
            $sheetEntries .
            '</Types>';
    }

    private function relsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' .
            '</Relationships>';
    }

    private function workbookXml(): string
    {
        $sheetEntries = '';
        $i = 1;
        foreach ($this->sheets as $name => $rows) {
            $safeName = $this->escapeXml(substr($name, 0, 31)); // Excel sheet name limit
            $sheetEntries .= "<sheet name=\"$safeName\" sheetId=\"$i\" r:id=\"rId{$i}\"/>";
            $i++;
        }
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' .
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' .
            "<sheets>$sheetEntries</sheets></workbook>";
    }

    private function workbookRelsXml(): string
    {
        $rels = '';
        $i = 1;
        foreach ($this->sheets as $name) {
            $rels .= "<Relationship Id=\"rId{$i}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{$i}.xml\"/>";
            $i++;
        }
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            $rels . '</Relationships>';
    }

    private function stylesXml(): string
    {
        // Two cell formats (xf): 0 = default, 1 = bold (for header rows).
        // Includes a <cellStyles> "Normal" entry — without it, some
        // spreadsheet readers (e.g. openpyxl) warn about a missing default
        // style, even though Excel itself opens the file fine either way.
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' .
            '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' .
            '<font><sz val="11"/><name val="Calibri"/><b/></font></fonts>' .
            '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' .
            '<borders count="1"><border/></borders>' .
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0"/></cellStyleXfs>' .
            '<cellXfs count="2"><xf numFmtId="0" fontId="0" xfId="0"/><xf numFmtId="0" fontId="1" xfId="0" applyFont="1"/></cellXfs>' .
            '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' .
            '</styleSheet>';
    }
}
