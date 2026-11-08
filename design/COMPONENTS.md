# AmazeCC Components

Build from AmazeUI first. Reach for a local component only when it encodes an
AmazeCC rule (attendance, timetable, campus data).

## 1. Buttons

| Kind         | Classes                                                            |
| ------------ | ------------------------------------------------------------------ |
| Primary      | `rounded-sm bg-accent text-background min-h-11 px-4 font-medium`   |
| Secondary    | `rounded-sm border border-line bg-surface text-ink`                |
| Quiet / link | `text-accent hover:underline`, or a ghost row button               |
| Destructive  | text in `text-danger`, `hover:bg-danger-soft`; no solid red blocks |

One primary button per region. Labels are sentence case and say the action
("Sync now", "Attend a class").

## 2. Cards and lists

- Card: `rounded-md border border-line bg-surface p-4`.
- List: the same shell with `divide-y divide-line-2`; rows `min-h-12`, icon
  (bare, `text-ink-2`), title, one line of metadata, value or chevron.
- Group long lists under small section labels (`text-[12.5px] font-semibold
text-muted`) rather than one endless list.

## 3. Status

`StatusBadge` (AmazeUI): `safe`, `warning`, `critical`, `neutral`, `info`,
`processing`. Always shows words; pass specific text as children ("Below
75%"). AmazeCC decides the status with `attendanceState()`.

## 4. Attendance

- `AttendanceBar`: progress with the target marker, filled in the course hue
  (amber on the line, red below it).
- Recovery sentence: "Attend the next 4 labs to get back to 75%." Labs are
  counted in lab sessions (two periods).
- What-if row: miss next, attend next, attend next 3.

## 5. Course identity

`CourseDot` and `SlotBadge` (AmazeUI) colour a course consistently; slot codes
are mono.

## 6. Overlays

- Bottom sheet (`AppLibrary`, `BottomSheet`): grabber, title, close; sized to
  content up to ~86% of the viewport; closes on backdrop, Escape and system
  back; labelled `role="dialog"`.
- Popover, dropdown and select: anchored to the trigger, flip when there is no
  room, close on outside press and Escape.

## 7. Forms

Inputs are `rounded-sm border border-line bg-surface min-h-11`, focus ring in
the accent. Switches are 40×24 with the accent as the "on" track.

## 8. Empty and unavailable states

Say what would appear and how to get it ("Exams, holidays and Moodle deadlines
show up here…", with Reload or Connect). A service that cannot work in the
current mode says so ("Not available in the demo") instead of failing.
