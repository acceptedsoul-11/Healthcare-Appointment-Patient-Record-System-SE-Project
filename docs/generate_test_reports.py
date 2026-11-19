"""Generate the four final healthcare test execution PDFs from Vitest coverage data."""

from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs"
COVERAGE_FILE = ROOT / "coverage" / "coverage-final.json"
RUN_DATE = date(2026, 11, 19).strftime("%d %b %Y")
TEST_FILES = 12
TESTS = 42
PASSED = 42
FAILED = 0
BLOCKED = 0


def coverage_metrics() -> dict[str, tuple[int, int, float]]:
    raw = json.loads(COVERAGE_FILE.read_text(encoding="utf-8"))
    totals = {name: [0, 0] for name in ("Statements", "Branches", "Functions", "Lines")}
    for entry in raw.values():
        for name, key in (("Statements", "s"), ("Branches", "b"), ("Functions", "f")):
            counts = entry.get(key, {})
            values = [count for group in counts.values() for count in group] if key == "b" else list(counts.values())
            totals[name][0] += sum(value > 0 for value in values)
            totals[name][1] += len(values)
        line_counts = entry.get("l")
        if line_counts is None:
            # V8's JSON omits a line map. Derive Istanbul-compatible line hits
            # from statement start lines, counting a line only when all its
            # statements were exercised.
            line_counts = {}
            for statement_id, statement in entry.get("statementMap", {}).items():
                line = str(statement["start"]["line"])
                hit = entry.get("s", {}).get(statement_id, 0)
                line_counts[line] = min(line_counts.get(line, hit), hit)
        line_values = list(line_counts.values())
        totals["Lines"][0] += sum(value > 0 for value in line_values)
        totals["Lines"][1] += len(line_values)
    return {
        name: (covered, total, (math.floor(covered / total * 100 * 100) / 100) if total else 0.0)
        for name, (covered, total) in totals.items()
    }


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("ReportTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=colors.HexColor("#123047"), alignment=TA_LEFT, spaceAfter=6),
        "subtitle": ParagraphStyle("ReportSubtitle", parent=base["Normal"], fontSize=10, leading=15, textColor=colors.HexColor("#506579"), spaceAfter=14),
        "heading": ParagraphStyle("SectionHeading", parent=base["Heading2"], fontSize=12, leading=16, textColor=colors.HexColor("#146C78"), spaceBefore=10, spaceAfter=6),
        "body": ParagraphStyle("BodyTextClean", parent=base["BodyText"], fontSize=9, leading=13, textColor=colors.HexColor("#243645"), spaceAfter=5),
        "cell": ParagraphStyle("CellText", parent=base["BodyText"], fontSize=8, leading=10, textColor=colors.HexColor("#243645")),
        "cell_head": ParagraphStyle("CellHeader", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white),
    }


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9E3E8"))
    canvas.line(18 * mm, 15 * mm, 192 * mm, 15 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#607684"))
    canvas.drawString(18 * mm, 10 * mm, f"Synthetic test data only | {RUN_DATE}")
    canvas.drawRightString(192 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def table(rows, widths, styles):
    converted = []
    for row_index, row in enumerate(rows):
        style = styles["cell_head"] if row_index == 0 else styles["cell"]
        converted.append([Paragraph(str(value), style) for value in row])
    result = Table(converted, colWidths=widths, repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#146C78")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F7F8")]),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E3E8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return result


def build_pdf(filename: str, title: str, subtitle: str, sections, metrics):
    styles = make_styles()
    story = [Paragraph(title, styles["title"]), Paragraph(subtitle, styles["subtitle"])]
    for heading, content in sections:
        story.append(Paragraph(heading, styles["heading"]))
        story.append(Spacer(1, 1.5 * mm))
        if isinstance(content, list) and content and isinstance(content[0], list):
            story.append(table(content, [174 * mm / len(content[0])] * len(content[0]), styles))
        elif isinstance(content, list):
            for item in content:
                story.append(Paragraph(f"&#8226; {item}", styles["body"]))
                story.append(Spacer(1, 1.5 * mm))
        else:
            story.append(Paragraph(content, styles["body"]))
        story.append(Spacer(1, 2 * mm))
    document = SimpleDocTemplate(str(OUTPUT / filename), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=17 * mm, bottomMargin=21 * mm, title=title, author="Healthcare QA")
    document.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    if not COVERAGE_FILE.exists():
        raise FileNotFoundError(f"Run npm run test:coverage first; missing {COVERAGE_FILE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    metrics = coverage_metrics()
    coverage_rows = [["Metric", "Covered", "Total", "Percent"]]
    for name, (covered, total, percent) in metrics.items():
        coverage_rows.append([name, str(covered), str(total), f"{percent:.2f}%"])

    build_pdf("unit-test-report.pdf", "Unit Test Report", "Healthcare Appointment and Patient Record System | Automated execution", [
        ("Execution result", [["Test files", "Tests", "Passed", "Failed", "Blocked"], [str(TEST_FILES), str(TESTS), str(PASSED), str(FAILED), str(BLOCKED)]]),
        ("Command and environment", ["Command: npm test. Vitest 3.2.7 ran in Node environment on 19 Nov 2026.", "Database calls were mocked. Test data is synthetic and uses example.test addresses and reserved fake identifiers."]),
        ("Verified areas", ["Login: signed token cookie for valid login; invalid password rejected without a cookie.", "Registration API: malformed payload rejected before database access; schema acceptance is covered separately.", "Session/logout: signed token verification and cookie clearing.", "Profile, doctor availability, appointment lifecycle, medical-record ownership, and prescription input validation."]),
        ("Limitations", ["Successful patient account persistence was not exercised against MongoDB.", "These are route and validation tests, not a browser end-to-end suite."]),
    ], metrics)

    build_pdf("system-validation-report.pdf", "System Validation Report", "Route-level integration and final build smoke check", [
        ("Execution summary", [["Vitest", "Typecheck", "Production build", "Live DB / browser"], ["42 passed / 0 failed", "Passed", "Passed with warnings", "Not run"]]),
        ("Scenarios exercised", ["Valid and invalid login, signed session verification, logout cookie expiry, malformed registration API input.", "Patient-only profile authorization and owner-scoped profile update.", "Doctor availability validation; booking success, overlapping conflict, unavailable weekday, and past date rejection.", "Appointment reschedule and cancellation.", "Patient medical-record filter, wrong-doctor appointment rejection, invalid prescription fields."]),
        ("Smoke check", "npm run build completed successfully and generated all app routes. Local production HTTP checks returned 200 for GET /login and 401 for unauthenticated GET /api/appointments and /api/records. Build emitted four dynamic filesystem tracing warnings in medical-report/photo upload routes; these are recorded as warnings, not test failures."),
        ("Not validated", ["Live MongoDB transactions, real account persistence, browser navigation/session refresh, and live notification/audit side effects.", "Prior screenshots in tests/evidence are inherited repository artifacts and were not captured or revalidated in this run."]),
    ], metrics)

    build_pdf("code-coverage-report.pdf", "Code Coverage Report", "Vitest v8 coverage across the repository", [
        ("Measured coverage", coverage_rows),
        ("Command", "npm run test:coverage | 12 test files and 42 tests passed."),
        ("Scope", "Coverage is measured over the whole Next.js repository, including pages and untested API routes. It is not a UI coverage percentage. The tested appointment, login, logout, doctor availability, profile, records, and auth validation handlers show per-file coverage in coverage/index.html."),
        ("Interpretation", "The aggregate statement and line percentage remains low because most pages and routes are not exercised. Coverage confirms which code executed; it does not establish correctness of untested integrations."),
    ], metrics)

    branch_rows = [["Measure", "Covered", "Total", "Percent"], ["Branch paths", str(metrics["Branches"][0]), str(metrics["Branches"][1]), f"{metrics['Branches'][2]:.2f}%"]]
    build_pdf("branch-coverage-report.pdf", "Branch Coverage Report", "Conditional outcomes measured by Vitest v8", [
        ("Branch result", branch_rows),
        ("Branches exercised", ["Valid versus invalid login and registration validation.", "Authenticated, unauthenticated, and role-denied authorization.", "Availability accepted/rejected; appointment conflict, unavailable-day and past-date branches.", "Appointment reschedule and cancellation transitions.", "Record ownership rejection and prescription validation."]),
        ("Remaining branch gaps", "The full repository includes many untested UI pages and unrelated API handlers. Error/database exception paths and successful MongoDB transaction paths remain outside this run."),
        ("Execution", "npm run test:coverage completed with 42 passed, 0 failed. Percentages are the actual aggregate from coverage/coverage-final.json."),
    ], metrics)

    print(f"Generated four reports in {OUTPUT}")
    for filename in ("unit-test-report.pdf", "system-validation-report.pdf", "code-coverage-report.pdf", "branch-coverage-report.pdf"):
        print(filename)


if __name__ == "__main__":
    main()
