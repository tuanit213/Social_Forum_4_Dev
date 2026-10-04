# Week 1 UI Inventory

## Shared shell

The desktop sidebar and mobile menu now consume the same navigation definition. On narrow screens the navbar exposes an accessible menu button and hides secondary controls that do not fit. Route changes close the mobile menu.

## Profile surfaces

`UserProfile` now compares the normalized `username` field, so the owner sees `Chỉnh sửa hồ sơ` and does not see the follow action. Load failures show a retry action. Follow requests expose a loading state and server-provided follower count.

`ProfileDashboard` disables save actions while a request is active and communicates the saving state through button text and `aria-busy`.

## Responsive verification

Authenticated owner profile checks passed at 375, 768, and 1440 CSS pixels. Each viewport reported no horizontal overflow, displayed the edit action, and omitted the follow action. The 375 pixel check also verified mobile menu open/close and route navigation.
