// docs/서비스이용약관.md → docs/서비스이용약관.docx
// 노션에 붙여넣어도 코드블록이 되지 않도록 실제 Word 서식(제목/번호목록/불릿)으로 변환해요.
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  LevelFormat,
  AlignmentType,
} = require("docx");

const mdPath = path.join(__dirname, "..", "docs", "서비스이용약관.md");
const outPath = path.join(__dirname, "..", "docs", "서비스이용약관.docx");
const FONT = "Malgun Gothic";

const lines = fs.readFileSync(mdPath, "utf8").split(/\r?\n/);

// 번호목록 reference: 조(##)가 바뀔 때마다 새로 만들어 1부터 다시 시작
let orderedRefs = [];
let curRef = null;
let articleIdx = 0;

const children = [];

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, ...opts });
}

for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");
  if (line.trim() === "") continue;

  let m;
  if ((m = line.match(/^#\s+(.+)/))) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [run(m[1], { bold: true, size: 30 })],
      }),
    );
  } else if ((m = line.match(/^##\s+(.+)/))) {
    articleIdx += 1;
    curRef = `ol-${articleIdx}`;
    orderedRefs.push(curRef);
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [run(m[1], { bold: true, size: 24 })],
      }),
    );
  } else if ((m = line.match(/^\s+(\d+)\)\s+(.+)/))) {
    // 하위 항목 (1) 2) ...) → level 1
    children.push(
      new Paragraph({
        numbering: { reference: curRef || "ol-fallback", level: 1 },
        children: [run(m[2])],
      }),
    );
  } else if ((m = line.match(/^(\d+)\.\s+(.+)/))) {
    // 조 항목 1. 2. ... → level 0
    children.push(
      new Paragraph({
        numbering: { reference: curRef || "ol-fallback", level: 0 },
        children: [run(m[2])],
      }),
    );
  } else if ((m = line.match(/^-\s+(.+)/))) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [run(m[1])],
      }),
    );
  } else {
    children.push(
      new Paragraph({ spacing: { after: 120 }, children: [run(line)] }),
    );
  }
}

// 번호목록 설정 (각 조마다 독립 reference → 1부터 재시작)
const allRefs = [...orderedRefs, "ol-fallback"];
const numberingConfig = allRefs.map((reference) => ({
  reference,
  levels: [
    {
      level: 0,
      format: LevelFormat.DECIMAL,
      text: "%1.",
      alignment: AlignmentType.START,
      style: { paragraphProperties: { indent: { left: 420, hanging: 260 } } },
    },
    {
      level: 1,
      format: LevelFormat.DECIMAL,
      text: "%2)",
      alignment: AlignmentType.START,
      style: { paragraphProperties: { indent: { left: 840, hanging: 280 } } },
    },
  ],
}));

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } },
    },
  },
  numbering: { config: numberingConfig },
  sections: [{ children }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("wrote", outPath, buf.length, "bytes");
});
