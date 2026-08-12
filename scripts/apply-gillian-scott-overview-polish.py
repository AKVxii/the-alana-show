from pathlib import Path

path = Path("src/detail-page.js")
text = path.read_text(encoding="utf-8")
marker = 'body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary'
if marker in text:
    raise SystemExit(0)

needle = "  .related-section { padding-top: 18px; margin-top: 14px; }\n"
addition = '''  .related-section { padding-top: 18px; margin-top: 14px; }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:not(.related-eyebrow) {
    max-width: 78ch;
    margin: 0 0 18px;
    line-height: 1.72;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4),
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5) {
    display: inline-block;
    width: calc(50% - 10px);
    max-width: none;
    vertical-align: top;
    padding: 18px 20px;
    margin-top: 4px;
    margin-bottom: 22px;
    border: 1px solid rgba(213, 174, 83, .26);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(8, 25, 46, .78), rgba(3, 12, 25, .58));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4) {
    margin-right: 16px;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4)::first-line,
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5)::first-line {
    color: #e2bd62;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.16rem;
    font-weight: 700;
    line-height: 1.7;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(6) {
    clear: both;
    margin-top: 2px;
    color: rgba(245, 247, 250, .88);
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(7) {
    color: #e2bd62;
    font-size: .96rem;
    letter-spacing: .025em;
  }
'''
if text.count(needle) != 1:
    raise SystemExit(f"Expected one related-section style anchor, found {text.count(needle)}")
text = text.replace(needle, addition, 1)

mobile = "    .guest-detail-intro { padding: 16px 0; }\n"
mobile_addition = '''    .guest-detail-intro { padding: 16px 0; }
    body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4),
    body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5) {
      display: block;
      width: 100%;
      margin-right: 0;
      padding: 16px;
    }
'''
if text.count(mobile) != 1:
    raise SystemExit(f"Expected one mobile style anchor, found {text.count(mobile)}")
text = text.replace(mobile, mobile_addition, 1)
path.write_text(text, encoding="utf-8")
