# Codex Harness

Codex Harness là workflow cá nhân cho Codex, kết hợp router, specialist agents, quy trình kiểm chứng, Ponytail, Context7, CodeGraph và Codex Memories.

## Flow

```text
Prompt
  → Understand
  → Direct hoặc Harness
  → Execute
  → Verify
  → Report
```

- `direct`: tài liệu, cấu hình hoặc thay đổi cục bộ có tiêu chí rõ ràng.
- `harness`: nguyên nhân chưa rõ, nhiều module, public API, schema/migration, security, concurrency hoặc dependency mới.
- Có thể ép route bằng tiền tố `direct:` hoặc `harness:`.

Trong bước thực thi, Ponytail ưu tiên giải pháp nhỏ nhất đúng yêu cầu; TDD chạy theo RED → GREEN → REFACTOR khi thay đổi hành vi. Context7 và CodeGraph chỉ được gọi khi cần.

## Thành phần

- `harness-router`: chọn workflow một lần trước khi chỉnh sửa.
- `coding-workflow`: triển khai, kiểm thử, review diff và báo bằng chứng.
- `harness_explorer`: khám phá repository ở chế độ read-only.
- `harness_planner`: lập kế hoạch ở chế độ read-only.
- `harness_implementer`: writer duy nhất.
- `harness_reviewer`: review độc lập ở chế độ read-only.
- Ponytail: sáu skill và lifecycle hooks, vendored từ phiên bản được ghi trong `third_party/ponytail/SOURCE.md`.
- Context7 MCP: tài liệu library/API hiện hành.
- CodeGraph MCP: phân tích code graph khi repository đã có `.codegraph/`.
- Codex Memories: nhớ preference và kiến thức bền vững; instructions/repository luôn có ưu tiên cao hơn memory.

## Yêu cầu

- Codex CLI hoặc Codex app có hỗ trợ plugin.
- Node.js có trong `PATH` để chạy Ponytail hooks.
- CodeGraph CLI nếu muốn dùng CodeGraph MCP:

```powershell
npm install -g @colbymchenry/codegraph@latest
```

Không cần khởi tạo CodeGraph cho mọi repository. Chỉ chạy `codegraph init` khi bạn chủ động yêu cầu.

## Cài trực tiếp từ GitHub

```powershell
codex plugin marketplace add minhnguyen1108/codex-harness --ref main
codex plugin add codex-harness@codex-harness
```

Cài bốn specialist agents:

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\agents" | Out-Null
Copy-Item ".\setup\agents\*.toml" "$HOME\.codex\agents\" -Force
```

Nếu cài marketplace trực tiếp từ GitHub mà không clone repo, tải hoặc copy riêng các file trong `setup/agents/` vào `~/.codex/agents/`.

Sau khi cài, restart Codex, trust các lifecycle hooks của Ponytail khi được hỏi, rồi mở thread mới.

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

## An toàn

- Không tự commit, push hoặc mở pull request.
- Không tự thêm dependency hoặc chạy `codegraph init`.
- Context7 chỉ nhận tên library, version và câu hỏi API công khai.
- Chỉ Implementer được sửa file trong harness workflow.
- Reviewer cho phép tối đa hai vòng sửa-review trước khi báo blocker.

## Giấy phép

Phần Codex Harness được phát hành theo MIT License. Ponytail giữ nguyên giấy phép và attribution trong `plugins/codex-harness/third_party/ponytail/`.
