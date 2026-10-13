import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";

import MembersPage from "./MembersPage";

const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const ASCBMod = findByProps("ActionSheetCloseButton");
const ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
const { openLazy, hideActionSheet } = findByProps("openLazy", "hideActionSheet") ?? {};
const GuildRoleStore = findByProps("getSortedRoles", "getRole") ?? findByStoreName("GuildRoleStore");
const TableRowMod = findByProps("TableRow");
const TableRow = TableRowMod?.TableRow;
const TableRowGroup = findByProps("TableRowGroup")?.TableRowGroup ?? TableRowMod?.TableRowGroup;

const TextStyleSheet = findByProps("TextStyleSheet")?.TextStyleSheet;
const colorModule = findByProps("colors", "unsafe_rawColors");
const colorResolver = colorModule?.internal ?? colorModule?.meta;
const ThemeStore = findByStoreName("ThemeStore");

function sc(key: string): string {
    const t = ThemeStore?.theme ?? "dark";
    const uk = key.replace(/-/g, "_").toUpperCase();
    const sym = (semanticColors as any)?.[key] ?? (semanticColors as any)?.[uk];
    if (!sym) return "#DBDCDD";
    const resolved = colorResolver?.resolveSemanticColor?.(t, sym);
    return typeof resolved === "string" ? resolved : "#DBDCDD";
}

function T(p: any) {
    const { style, variant, ...rest } = p;
    return (
        <RN.Text
            style={[
                variant && TextStyleSheet?.[variant as keyof typeof TextStyleSheet],
                style?.color ? {} : { color: sc("text-default") },
                style,
            ]}
            {...rest}
        />
    );
}

function roleColorHex(role: any): string | null {
    if (!role) return null;
    if (typeof role.colorString === "string" && role.colorString) return role.colorString;
    if (typeof role.color === "number" && role.color > 0) {
        return "#" + role.color.toString(16).padStart(6, "0");
    }
    return null;
}

export default function RoleListPage({ guildId }: { guildId: string }) {
    let roles: any[] = [];
    try {
        const sorted = GuildRoleStore?.getSortedRoles?.(guildId);
        if (sorted) roles = Array.from(sorted);
        else if (GuildRoleStore?.getRoles) {
            const obj = GuildRoleStore.getRoles(guildId) ?? {};
            roles = Object.values(obj).sort((a: any, b: any) => (b.position ?? 0) - (a.position ?? 0));
        }
    } catch {
        roles = [];
    }

    // Skip @everyone (role id === guild id)
    roles = roles.filter((r) => r && r.id !== guildId);

    return (
        <ActionSheet>
            <RN.View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                }}
            >
                <RN.View style={{ width: 40 }} />
                <T variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>
                    View members with role
                </T>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, {
                          onPress: () => hideActionSheet?.(),
                      })
                    : React.createElement(
                          T,
                          {
                              variant: "text-md/semibold",
                              style: { color: rawColors.BRAND_500 },
                              onPress: () => hideActionSheet?.(),
                          },
                          "Close",
                      )}
            </RN.View>

            <RN.ScrollView style={{ maxHeight: 480 }}>
                <TableRowGroup>
                    {roles.map((role: any) => {
                        const color = roleColorHex(role);
                        return React.createElement(TableRow, {
                            key: role.id,
                            label: color
                                ? React.createElement(
                                      RN.View,
                                      { style: { flexDirection: "row", alignItems: "center" } },
                                      React.createElement(RN.View, {
                                          style: {
                                              width: 12,
                                              height: 12,
                                              borderRadius: 6,
                                              backgroundColor: color,
                                              marginRight: 8,
                                          },
                                      }),
                                      React.createElement(T, { variant: "text-md/semibold" }, role.name),
                                  )
                                : role.name,
                            trailing: TableRow.Arrow
                                ? () => React.createElement(TableRow.Arrow, null)
                                : undefined,
                            onPress: () => {
                                hideActionSheet?.();
                                openLazy?.(Promise.resolve({ default: MembersPage }), "vmwr-members-" + role.id, {
                                    guildId,
                                    roleId: role.id,
                                    roleName: role.name,
                                    roleColor: color,
                                });
                            },
                        });
                    })}
                    {roles.length === 0 && (
                        <RN.View style={{ padding: 16, alignItems: "center" }}>
                            <T variant="text-md/medium">No roles found</T>
                        </RN.View>
                    )}
                </TableRowGroup>
            </RN.ScrollView>
        </ActionSheet>
    );
}
