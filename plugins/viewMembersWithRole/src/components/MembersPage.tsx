import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";

import RoleListPage from "./RoleListPage";

const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const ASCBMod = findByProps("ActionSheetCloseButton");
const ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
const { openLazy, hideActionSheet } = findByProps("openLazy", "hideActionSheet") ?? {};

const TableRowMod = findByProps("TableRow");
const TableRow = TableRowMod?.TableRow;
const TableRowGroup = findByProps("TableRowGroup")?.TableRowGroup ?? TableRowMod?.TableRowGroup;

const TextStyleSheet = findByProps("TextStyleSheet")?.TextStyleSheet;
const colorModule = findByProps("colors", "unsafe_rawColors");
const colorResolver = colorModule?.internal ?? colorModule?.meta;
const ThemeStore = findByStoreName("ThemeStore");

const UserStore = findByStoreName("UserStore") ?? findByProps("getUser", "getCurrentUser");
const GuildMemberStore =
    findByStoreName("GuildMemberStore") ?? findByProps("getMembers", "getMember");
const RestAPI = findByProps("get", "post") ?? findByProps("getAPIBaseURL");
const Constants = findByProps("Endpoints") ?? findByProps("API_HOST");
const GuildUtils =
    findByProps("requestMembersById") ??
    findByProps("requestMembers") ??
    findByProps("requestMembersById", "requestMembers");

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

function getAvatarUrl(user: any): string | null {
    if (!user) return null;
    try {
        if (typeof user.getAvatarURL === "function") {
            return user.getAvatarURL(false, 64, true) ?? user.getAvatarURL();
        }
        if (user.avatar) {
            const ext = user.avatar.startsWith("a_") ? "gif" : "png";
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=64`;
        }
        const idx = Number((BigInt(user.id) >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
        return null;
    }
}

function displayName(user: any): string {
    if (!user) return "Unknown";
    return user.globalName || user.displayName || user.username || user.id || "Unknown";
}

export default function MembersPage({
    guildId,
    roleId,
    roleName,
    roleColor,
}: {
    guildId: string;
    roleId: string;
    roleName?: string;
    roleColor?: string | null;
}) {
    const [memberCount, setMemberCount] = React.useState<number | null>(null);
    const [memberIds, setMemberIds] = React.useState<string[]>([]);
    const [fetched, setFetched] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [tick, setTick] = React.useState(0);

    // Fetch role member counts + member IDs
    React.useEffect(() => {
        let cancelled = false;
        let countInterval: any;
        let idsInterval: any;

        const fetchCounts = async () => {
            try {
                const endpoints = Constants?.Endpoints;
                const url =
                    endpoints?.GUILD_ROLE_MEMBER_COUNTS?.(guildId) ??
                    `/guilds/${guildId}/roles/member-counts`;
                const res = await RestAPI?.get?.({ url });
                if (cancelled) return;
                if (res?.ok || res?.body) {
                    const body = res.body ?? res;
                    const count = body?.[roleId] ?? body?.[String(roleId)];
                    if (typeof count === "number") {
                        setMemberCount(count);
                        clearInterval(countInterval);
                    }
                }
            } catch (e) {
                // ignore, will retry
            }
        };

        const fetchIds = async () => {
            try {
                const endpoints = Constants?.Endpoints;
                const url =
                    endpoints?.GUILD_ROLE_MEMBER_IDS?.(guildId, roleId) ??
                    `/guilds/${guildId}/roles/${roleId}/member-ids`;
                const res = await RestAPI?.get?.({ url });
                if (cancelled) return;
                if (res?.ok || res?.body || Array.isArray(res)) {
                    const body = Array.isArray(res) ? res : res.body ?? res;
                    const ids: string[] = Array.isArray(body) ? body : body?.member_ids ?? [];
                    setMemberIds(ids);
                    setFetched(true);
                    clearInterval(idsInterval);

                    // Request members so UserStore / GuildMemberStore hydrate
                    try {
                        if (GuildUtils?.requestMembersById && ids.length) {
                            GuildUtils.requestMembersById(guildId, ids, false);
                        } else if (GuildUtils?.requestMembers && ids.length) {
                            GuildUtils.requestMembers(guildId, ids);
                        }
                    } catch {
                        // non-fatal
                    }
                }
            } catch (e) {
                // ignore, will retry
            }
        };

        countInterval = setInterval(fetchCounts, 1000);
        idsInterval = setInterval(fetchIds, 1200);
        fetchCounts();
        fetchIds();

        // Stop loading spinner after a while even if API is slow
        const timeout = setTimeout(() => setLoading(false), 8000);

        return () => {
            cancelled = true;
            clearInterval(countInterval);
            clearInterval(idsInterval);
            clearTimeout(timeout);
        };
    }, [guildId, roleId]);

    // Poll GuildMemberStore so newly requested members appear
    React.useEffect(() => {
        if (!fetched) return;
        const id = setInterval(() => setTick((t) => t + 1), 600);
        const stop = setTimeout(() => {
            clearInterval(id);
            setLoading(false);
        }, 6000);
        return () => {
            clearInterval(id);
            clearTimeout(stop);
        };
    }, [fetched, roleId]);

    // Build the list of users that currently have this role (from cache + fetched ids)
    const users = React.useMemo(() => {
        const seen = new Set<string>();
        const result: any[] = [];

        // Prefer members already known to have the role in GuildMemberStore
        try {
            const members = GuildMemberStore?.getMembers?.(guildId) ?? [];
            for (const m of members) {
                const roles: string[] = m.roles ?? m.roleIds ?? [];
                if (roles.includes(roleId)) {
                    const uid = m.userId ?? m.id;
                    if (uid && !seen.has(uid)) {
                        seen.add(uid);
                        const u = UserStore?.getUser?.(uid);
                        if (u) result.push(u);
                    }
                }
            }
        } catch {
            // ignore
        }

        // Also include any fetched IDs that resolved in UserStore
        for (const id of memberIds) {
            if (seen.has(id)) continue;
            const u = UserStore?.getUser?.(id);
            if (u) {
                seen.add(id);
                result.push(u);
            }
        }

        // Stable sort by display name
        result.sort((a, b) =>
            displayName(a).localeCompare(displayName(b), undefined, { sensitivity: "base" }),
        );
        return result;
    }, [guildId, roleId, memberIds, tick]);

    React.useEffect(() => {
        if (fetched) setLoading(false);
    }, [fetched]);

    const titleColor = roleColor || undefined;
    const total = memberCount ?? memberIds.length;
    const loaded = users.length;

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
                <T
                    variant="text-md/semibold"
                    style={{ color: rawColors.BRAND_500 }}
                    onPress={() => {
                        hideActionSheet?.();
                        openLazy?.(Promise.resolve({ default: RoleListPage }), "vmwr-roles", {
                            guildId,
                        });
                    }}
                >
                    Back
                </T>
                <T
                    variant="heading-md/semibold"
                    style={{
                        flex: 1,
                        textAlign: "center",
                        ...(titleColor ? { color: titleColor } : {}),
                    }}
                >
                    {roleName || "Role members"}
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

            {/* Header: counts + limit note */}
            <RN.View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <T variant="text-sm/medium" style={{ color: sc("text-muted") }}>
                    {loaded} loaded / {total || "?"} members with this role
                </T>
                <T variant="text-xs/normal" style={{ color: sc("text-muted"), marginTop: 2 }}>
                    Roles with 100+ members only show the first 100 + already cached members.
                </T>
            </RN.View>

            <RN.ScrollView style={{ maxHeight: 420 }}>
                {loading && users.length === 0 ? (
                    <RN.View style={{ padding: 24, alignItems: "center" }}>
                        <T variant="text-md/medium">Loading members…</T>
                    </RN.View>
                ) : users.length === 0 ? (
                    <RN.View style={{ padding: 24, alignItems: "center" }}>
                        <T variant="text-md/medium">
                            {memberCount === 0
                                ? "No members have this role"
                                : "No cached members found yet"}
                        </T>
                    </RN.View>
                ) : (
                    <TableRowGroup>
                        {users.map((user) => {
                            const avatar = getAvatarUrl(user);
                            return React.createElement(TableRow, {
                                key: user.id,
                                label: React.createElement(
                                    RN.View,
                                    {
                                        style: {
                                            flexDirection: "row",
                                            alignItems: "center",
                                        },
                                    },
                                    avatar
                                        ? React.createElement(RN.Image, {
                                              source: { uri: avatar },
                                              style: {
                                                  width: 28,
                                                  height: 28,
                                                  borderRadius: 14,
                                                  marginRight: 10,
                                              },
                                          })
                                        : React.createElement(RN.View, {
                                              style: {
                                                  width: 28,
                                                  height: 28,
                                                  borderRadius: 14,
                                                  marginRight: 10,
                                                  backgroundColor: sc("background-modifier-accent"),
                                              },
                                          }),
                                    React.createElement(
                                        RN.View,
                                        { style: { flexShrink: 1 } },
                                        React.createElement(
                                            T,
                                            { variant: "text-md/semibold" },
                                            displayName(user),
                                        ),
                                        user.username && user.username !== displayName(user)
                                            ? React.createElement(
                                                  T,
                                                  {
                                                      variant: "text-xs/normal",
                                                      style: { color: sc("text-muted") },
                                                  },
                                                  "@" + user.username,
                                              )
                                            : null,
                                    ),
                                ),
                            });
                        })}
                    </TableRowGroup>
                )}

                {!loading && fetched && total > 0 && loaded >= Math.min(total, 100) && (
                    <RN.View style={{ padding: 12, alignItems: "center" }}>
                        <T variant="text-sm/normal" style={{ color: sc("text-muted"), fontStyle: "italic" }}>
                            {total <= 100 ? "All members loaded" : "All cached / first-100 members loaded"}
                        </T>
                    </RN.View>
                )}
            </RN.ScrollView>
        </ActionSheet>
    );
}
