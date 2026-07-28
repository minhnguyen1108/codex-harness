# Codex Harness

Codex Harness là workflow cá nhân cho Codex, kết hợp router, specialist agents, quy trình kiểm chứng, Ponytail, Context7, CodeGraph và Codex Memories.

Phiên bản phát hành hiện tại là `v0.2.0`. Tag cài đặt tái lập `v0.2.0` chỉ dùng được sau khi việc xuất bản/tag Git được cho phép.

## Flow

```text
Prompt
  → Understand
  → Direct hoặc Harness
  → Execute
  → Verify
  → Report
```

- `direct`: tài liệu, cấu hình localized, low-risk hoặc thay đổi cục bộ có tiêu chí rõ ràng.
- `harness`: nguyên nhân chưa rõ, nhiều module, public API, schema/migration, security, concurrency hoặc dependency mới.
- Có thể ép route bằng tiền tố `direct:` hoặc `harness:`.

Nhánh `harness` dùng fan-out/fan-in để tăng tốc:

```text
Goal / Constraints / Done When
  → tách 2–3 workstream read-only độc lập
  → Explorer chạy song song
  → join evidence
  → một Planner tổng hợp
  → một Implementer sửa file
  → 1–2 Reviewer read-only theo risk
  → một verdict cuối
```

Task nhỏ không tạo subagent. Workstream có dependency hoặc dùng chung mutable state sẽ chạy tuần tự.

Trong bước thực thi, Ponytail ưu tiên giải pháp nhỏ nhất đúng yêu cầu; TDD chạy theo RED → GREEN → REFACTOR khi thay đổi hành vi. Context7 và CodeGraph chỉ được gọi khi cần. Ponytail mode là session-scoped: `/ponytail lite|full|ultra|off` chỉ áp dụng cho session hiện tại, được giữ qua resume/compact và bị xóa khi session kết thúc.

## Thành phần

- `harness-router`: chọn workflow một lần trước khi chỉnh sửa.
- `coding-workflow`: triển khai, kiểm thử, review diff và báo bằng chứng.
- `harness_explorer`: có thể chạy tối đa ba instance read-only với scope độc lập.
- `harness_planner`: một instance tổng hợp toàn bộ evidence thành một plan.
- `harness_implementer`: writer duy nhất.
- `harness_reviewer`: một hoặc hai instance read-only theo review focus; coordinator hợp nhất một verdict.
- Ponytail: sáu skill và lifecycle hooks, vendored từ phiên bản được ghi trong `third_party/ponytail/SOURCE.md`.
- Context7 MCP: tài liệu library/API hiện hành.
- CodeGraph MCP: phân tích code graph khi repository đã có `.codegraph/`.
- Codex Memories: nhớ preference và kiến thức bền vững; instructions/repository luôn có ưu tiên cao hơn memory.

## Model theo vai trò

Decision Agent chọn model từ các model Codex báo khả dụng cho task hiện tại. Profile không gán cứng model: `direct` dùng model của task, còn `harness` phân bổ theo nhu cầu đọc, tổng hợp, triển khai và review; khi không thể override, fallback về model của task và ghi lại lý do.

## Yêu cầu

- Codex CLI hoặc Codex app có hỗ trợ plugin.
- Node.js có trong `PATH` để chạy Ponytail hooks.
- CodeGraph CLI nếu muốn dùng CodeGraph MCP:

```powershell
npm install -g @colbymchenry/codegraph@1.2.0
```

Không cần khởi tạo CodeGraph cho mọi repository. Chỉ chạy `codegraph init` khi bạn chủ động yêu cầu.

## Cài trực tiếp từ GitHub

Cài đặt rolling cho phát triển đang diễn ra dùng `main`:

```powershell
codex plugin marketplace add minhnguyen1108/codex-harness --ref main
codex plugin add codex-harness@codex-harness
```

Cài đặt tái lập dùng `v0.2.0` sau khi tag đó được xuất bản và việc phát hành Git đã được cho phép:

```powershell
codex plugin marketplace add minhnguyen1108/codex-harness --ref v0.2.0
codex plugin add codex-harness@codex-harness
```

Các specialist profiles được plugin tự đồng bộ vào `~/.codex/agents` khi SessionStart. Plugin chỉ cập nhật file có marker quản lý của chính nó; profile cùng tên do người dùng tự tạo sẽ được giữ nguyên và báo xung đột.

Sau khi cài, restart Codex, trust các lifecycle hooks của Ponytail khi được hỏi, rồi mở thread mới.

## Kiểm chứng

Hai lệnh sau không cần dependency package và chỉ Implementer được chạy khi chúng có thể ghi artifact trong harness workflow:

```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
```

## Bật Memories

Thêm vào `~/.codex/config.toml`:

```toml
[features]
memories = true

[memories]
generate_memories = true
use_memories = true
disable_on_external_context = false
```

Dùng `/memories` để điều khiển memory cho từng thread. Không commit thư mục `~/.codex/memories/`.

Memory phù hợp với preference, convention, command đã kiểm chứng, quyết định kiến trúc và lỗi thường gặp. Không dùng memory để lưu secret, token, dữ liệu cá nhân, raw log hoặc trạng thái tạm. Quy tắc bắt buộc phải nằm trong `AGENTS.md` hoặc tài liệu của repository.

## Context7

API key được đọc từ biến môi trường, không lưu trong Git:

```powershell
[Environment]::SetEnvironmentVariable(
  "CONTEXT7_API_KEY",
  "<YOUR_KEY>",
  "User"
)
```

Restart Codex sau khi thay đổi biến môi trường.

## Global instructions

Tham khảo `setup/AGENTS.example.md` và merge các quy tắc phù hợp vào `~/.codex/AGENTS.md`. Không ghi đè file hiện có nếu máy đã có global instructions riêng.

## Cách dùng

Prompt bình thường là đủ; router tự chọn workflow.

```text
Fix lỗi validation này và thêm regression test.
harness: thay đổi public API qua ba module.
direct: cập nhật đoạn mô tả trong README.
ponytail ultra: chỉ triển khai endpoint được yêu cầu.
Review this diff for over-engineering.
stop ponytail
```

## Cập nhật

```powershell
codex plugin marketplace upgrade codex-harness
codex plugin add codex-harness@codex-harness
```

Mở thread mới sau khi cập nhật để Codex nạp lại skills, hooks và MCP config.
Sau khi cập nhật, restart Codex và trust lại các lifecycle hooks khi được hỏi.

## An toàn

- Không tự commit, push hoặc mở pull request.
- Không tự thêm dependency hoặc chạy `codegraph init`.
- Context7 chỉ nhận tên library, version và câu hỏi API công khai.
- Chỉ Implementer được sửa file trong harness workflow.
- Chỉ top-level coordinator được tạo subagent; specialist không được nested-spawn.
- Tối đa ba child agent chạy đồng thời và không vượt capacity hiện có.
- Test/build ghi shared artifacts phải chạy tuần tự trên một workspace snapshot.
- Toàn pipeline có tối đa hai vòng sửa-review trước khi báo blocker.

## Giấy phép

Phần Codex Harness được phát hành theo MIT License. Ponytail giữ nguyên giấy phép và attribution trong `plugins/codex-harness/third_party/ponytail/`.
