(function(V){"use strict";
var plugin = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // plugins/viewMembersWithRole/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    default: () => src_default
  });

  // plugins/viewMembersWithRole/src/patches/patchServer.ts
  var import_patcher = vendetta.patcher;
  var import_metro3 = vendetta.metro;
  var import_common3 = vendetta.metro.common;
  var import_assets = vendetta.ui.assets;

  // plugins/viewMembersWithRole/src/components/RoleListPage.tsx
  var import_common2 = vendetta.metro.common;
  var import_metro2 = vendetta.metro;
  var import_ui2 = vendetta.ui;

  // plugins/viewMembersWithRole/src/components/MembersPage.tsx
  var import_common = vendetta.metro.common;
  var import_metro = vendetta.metro;
  var import_ui = vendetta.ui;
  var ActionSheet = (0, import_metro.findByProps)("ActionSheet")?.ActionSheet;
  var ASCBMod = (0, import_metro.findByProps)("ActionSheetCloseButton");
  var ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
  var { openLazy, hideActionSheet } = (0, import_metro.findByProps)("openLazy", "hideActionSheet") ?? {};
  var TableRowMod = (0, import_metro.findByProps)("TableRow");
  var TableRow = TableRowMod?.TableRow;
  var TableRowGroup = (0, import_metro.findByProps)("TableRowGroup")?.TableRowGroup ?? TableRowMod?.TableRowGroup;
  var TextStyleSheet = (0, import_metro.findByProps)("TextStyleSheet")?.TextStyleSheet;
  var colorModule = (0, import_metro.findByProps)("colors", "unsafe_rawColors");
  var colorResolver = colorModule?.internal ?? colorModule?.meta;
  var ThemeStore = (0, import_metro.findByStoreName)("ThemeStore");
  var UserStore = (0, import_metro.findByStoreName)("UserStore") ?? (0, import_metro.findByProps)("getUser", "getCurrentUser");
  var GuildMemberStore = (0, import_metro.findByStoreName)("GuildMemberStore") ?? (0, import_metro.findByProps)("getMembers", "getMember");
  var RestAPI = (0, import_metro.findByProps)("get", "post") ?? (0, import_metro.findByProps)("getAPIBaseURL");
  var Constants = (0, import_metro.findByProps)("Endpoints") ?? (0, import_metro.findByProps)("API_HOST");
  var GuildUtils = (0, import_metro.findByProps)("requestMembersById") ?? (0, import_metro.findByProps)("requestMembers") ?? (0, import_metro.findByProps)("requestMembersById", "requestMembers");
  function sc(key) {
    const t = ThemeStore?.theme ?? "dark";
    const uk = key.replace(/-/g, "_").toUpperCase();
    const sym = import_ui.semanticColors?.[key] ?? import_ui.semanticColors?.[uk];
    if (!sym)
      return "#DBDCDD";
    const resolved = colorResolver?.resolveSemanticColor?.(t, sym);
    return typeof resolved === "string" ? resolved : "#DBDCDD";
  }
  function T(p) {
    const { style, variant, children, ...rest } = p;
    return import_common.React.createElement(
      import_common.ReactNative.Text,
      {
        style: [
          variant && TextStyleSheet?.[variant],
          style?.color ? {} : { color: sc("text-default") },
          style
        ],
        ...rest
      },
      children
    );
  }
  function getAvatarUrl(user) {
    if (!user)
      return null;
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
  function displayName(user) {
    if (!user)
      return "Unknown";
    return user.globalName || user.displayName || user.username || user.id || "Unknown";
  }
  function MembersPage({
    guildId,
    roleId,
    roleName,
    roleColor
  }) {
    const [memberCount, setMemberCount] = import_common.React.useState(null);
    const [memberIds, setMemberIds] = import_common.React.useState([]);
    const [fetched, setFetched] = import_common.React.useState(false);
    const [loading, setLoading] = import_common.React.useState(true);
    const [tick, setTick] = import_common.React.useState(0);
    import_common.React.useEffect(() => {
      let cancelled = false;
      let countInterval;
      let idsInterval;
      const fetchCounts = async () => {
        try {
          const endpoints = Constants?.Endpoints;
          const url = endpoints?.GUILD_ROLE_MEMBER_COUNTS?.(guildId) ?? `/guilds/${guildId}/roles/member-counts`;
          const res = await RestAPI?.get?.({ url });
          if (cancelled)
            return;
          if (res?.ok || res?.body) {
            const body = res.body ?? res;
            const count = body?.[roleId] ?? body?.[String(roleId)];
            if (typeof count === "number") {
              setMemberCount(count);
              clearInterval(countInterval);
            }
          }
        } catch (e) {
        }
      };
      const fetchIds = async () => {
        try {
          const endpoints = Constants?.Endpoints;
          const url = endpoints?.GUILD_ROLE_MEMBER_IDS?.(guildId, roleId) ?? `/guilds/${guildId}/roles/${roleId}/member-ids`;
          const res = await RestAPI?.get?.({ url });
          if (cancelled)
            return;
          if (res?.ok || res?.body || Array.isArray(res)) {
            const body = Array.isArray(res) ? res : res.body ?? res;
            const ids = Array.isArray(body) ? body : body?.member_ids ?? [];
            setMemberIds(ids);
            setFetched(true);
            clearInterval(idsInterval);
            try {
              if (GuildUtils?.requestMembersById && ids.length) {
                GuildUtils.requestMembersById(guildId, ids, false);
              } else if (GuildUtils?.requestMembers && ids.length) {
                GuildUtils.requestMembers(guildId, ids);
              }
            } catch {
            }
          }
        } catch (e) {
        }
      };
      countInterval = setInterval(fetchCounts, 1e3);
      idsInterval = setInterval(fetchIds, 1200);
      fetchCounts();
      fetchIds();
      const timeout = setTimeout(() => setLoading(false), 8e3);
      return () => {
        cancelled = true;
        clearInterval(countInterval);
        clearInterval(idsInterval);
        clearTimeout(timeout);
      };
    }, [guildId, roleId]);
    import_common.React.useEffect(() => {
      if (!fetched)
        return;
      const id = setInterval(() => setTick((t) => t + 1), 600);
      const stop = setTimeout(() => {
        clearInterval(id);
        setLoading(false);
      }, 6e3);
      return () => {
        clearInterval(id);
        clearTimeout(stop);
      };
    }, [fetched, roleId]);
    const users = import_common.React.useMemo(() => {
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      try {
        const members = GuildMemberStore?.getMembers?.(guildId) ?? [];
        for (const m of members) {
          const roles = m.roles ?? m.roleIds ?? [];
          if (roles.includes(roleId)) {
            const uid = m.userId ?? m.id;
            if (uid && !seen.has(uid)) {
              seen.add(uid);
              const u = UserStore?.getUser?.(uid);
              if (u)
                result.push(u);
            }
          }
        }
      } catch {
      }
      for (const id of memberIds) {
        if (seen.has(id))
          continue;
        const u = UserStore?.getUser?.(id);
        if (u) {
          seen.add(id);
          result.push(u);
        }
      }
      result.sort(
        (a, b) => displayName(a).localeCompare(displayName(b), void 0, { sensitivity: "base" })
      );
      return result;
    }, [guildId, roleId, memberIds, tick]);
    import_common.React.useEffect(() => {
      if (fetched)
        setLoading(false);
    }, [fetched]);
    const titleColor = roleColor || void 0;
    const total = memberCount ?? memberIds.length;
    const loaded = users.length;
    return import_common.React.createElement(
      ActionSheet,
      null,
      import_common.React.createElement(
        import_common.ReactNative.View,
        {
          style: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16
          }
        },
        import_common.React.createElement(
          T,
          {
            variant: "text-md/semibold",
            style: { color: import_ui.rawColors.BRAND_500 },
            onPress: () => {
              hideActionSheet?.();
              openLazy?.(Promise.resolve({ default: RoleListPage }), "vmwr-roles", {
                guildId
              });
            }
          },
          "Back"
        ),
        import_common.React.createElement(
          T,
          {
            variant: "heading-md/semibold",
            style: {
              flex: 1,
              textAlign: "center",
              ...titleColor ? { color: titleColor } : {}
            }
          },
          roleName || "Role members"
        ),
        ActionSheetCloseButton ? import_common.React.createElement(ActionSheetCloseButton, {
          onPress: () => hideActionSheet?.()
        }) : import_common.React.createElement(
          T,
          {
            variant: "text-md/semibold",
            style: { color: import_ui.rawColors.BRAND_500 },
            onPress: () => hideActionSheet?.()
          },
          "Close"
        )
      ),
      import_common.React.createElement(
        import_common.ReactNative.View,
        { style: { paddingHorizontal: 16, paddingBottom: 8 } },
        import_common.React.createElement(
          T,
          { variant: "text-sm/medium", style: { color: sc("text-muted") } },
          `${loaded} loaded / ${total || "?"} members with this role`
        ),
        import_common.React.createElement(
          T,
          { variant: "text-xs/normal", style: { color: sc("text-muted"), marginTop: 2 } },
          "Roles with 100+ members only show the first 100 + already cached members."
        )
      ),
      import_common.React.createElement(
        import_common.ReactNative.ScrollView,
        { style: { maxHeight: 420 } },
        loading && users.length === 0 ? import_common.React.createElement(
          import_common.ReactNative.View,
          { style: { padding: 24, alignItems: "center" } },
          import_common.React.createElement(T, { variant: "text-md/medium" }, "Loading members\u2026")
        ) : users.length === 0 ? import_common.React.createElement(
          import_common.ReactNative.View,
          { style: { padding: 24, alignItems: "center" } },
          import_common.React.createElement(
            T,
            { variant: "text-md/medium" },
            memberCount === 0 ? "No members have this role" : "No cached members found yet"
          )
        ) : import_common.React.createElement(
          TableRowGroup,
          null,
          ...users.map((user) => {
            const avatar = getAvatarUrl(user);
            return import_common.React.createElement(TableRow, {
              key: user.id,
              label: import_common.React.createElement(
                import_common.ReactNative.View,
                { style: { flexDirection: "row", alignItems: "center" } },
                avatar ? import_common.React.createElement(import_common.ReactNative.Image, {
                  source: { uri: avatar },
                  style: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    marginRight: 10
                  }
                }) : import_common.React.createElement(import_common.ReactNative.View, {
                  style: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    marginRight: 10,
                    backgroundColor: sc("background-modifier-accent")
                  }
                }),
                import_common.React.createElement(
                  import_common.ReactNative.View,
                  { style: { flexShrink: 1 } },
                  import_common.React.createElement(
                    T,
                    { variant: "text-md/semibold" },
                    displayName(user)
                  ),
                  user.username && user.username !== displayName(user) ? import_common.React.createElement(
                    T,
                    {
                      variant: "text-xs/normal",
                      style: { color: sc("text-muted") }
                    },
                    "@" + user.username
                  ) : null
                )
              )
            });
          })
        ),
        !loading && fetched && total > 0 && loaded >= Math.min(total, 100) ? import_common.React.createElement(
          import_common.ReactNative.View,
          { style: { padding: 12, alignItems: "center" } },
          import_common.React.createElement(
            T,
            {
              variant: "text-sm/normal",
              style: { color: sc("text-muted"), fontStyle: "italic" }
            },
            total <= 100 ? "All members loaded" : "All cached / first-100 members loaded"
          )
        ) : null
      )
    );
  }

  // plugins/viewMembersWithRole/src/components/RoleListPage.tsx
  var ActionSheet2 = (0, import_metro2.findByProps)("ActionSheet")?.ActionSheet;
  var ASCBMod2 = (0, import_metro2.findByProps)("ActionSheetCloseButton");
  var ActionSheetCloseButton2 = ASCBMod2?.ActionSheetCloseButton;
  var { openLazy: openLazy2, hideActionSheet: hideActionSheet2 } = (0, import_metro2.findByProps)("openLazy", "hideActionSheet") ?? {};
  var GuildRoleStore = (0, import_metro2.findByProps)("getSortedRoles", "getRole") ?? (0, import_metro2.findByStoreName)("GuildRoleStore");
  var TableRowMod2 = (0, import_metro2.findByProps)("TableRow");
  var TableRow2 = TableRowMod2?.TableRow;
  var TableRowGroup2 = (0, import_metro2.findByProps)("TableRowGroup")?.TableRowGroup ?? TableRowMod2?.TableRowGroup;
  var TextStyleSheet2 = (0, import_metro2.findByProps)("TextStyleSheet")?.TextStyleSheet;
  var colorModule2 = (0, import_metro2.findByProps)("colors", "unsafe_rawColors");
  var colorResolver2 = colorModule2?.internal ?? colorModule2?.meta;
  var ThemeStore2 = (0, import_metro2.findByStoreName)("ThemeStore");
  function sc2(key) {
    const t = ThemeStore2?.theme ?? "dark";
    const uk = key.replace(/-/g, "_").toUpperCase();
    const sym = import_ui2.semanticColors?.[key] ?? import_ui2.semanticColors?.[uk];
    if (!sym)
      return "#DBDCDD";
    const resolved = colorResolver2?.resolveSemanticColor?.(t, sym);
    return typeof resolved === "string" ? resolved : "#DBDCDD";
  }
  function T2(p) {
    const { style, variant, children, ...rest } = p;
    return import_common2.React.createElement(
      import_common2.ReactNative.Text,
      {
        style: [
          variant && TextStyleSheet2?.[variant],
          style?.color ? {} : { color: sc2("text-default") },
          style
        ],
        ...rest
      },
      children
    );
  }
  function roleColorHex(role) {
    if (!role)
      return null;
    if (typeof role.colorString === "string" && role.colorString)
      return role.colorString;
    if (typeof role.color === "number" && role.color > 0) {
      return "#" + role.color.toString(16).padStart(6, "0");
    }
    return null;
  }
  function RoleListPage({ guildId }) {
    let roles = [];
    try {
      const sorted = GuildRoleStore?.getSortedRoles?.(guildId);
      if (sorted)
        roles = Array.from(sorted);
      else if (GuildRoleStore?.getRoles) {
        const obj = GuildRoleStore.getRoles(guildId) ?? {};
        roles = Object.values(obj).sort((a, b) => (b.position ?? 0) - (a.position ?? 0));
      }
    } catch {
      roles = [];
    }
    roles = roles.filter((r) => r && r.id !== guildId);
    return import_common2.React.createElement(
      ActionSheet2,
      null,
      import_common2.React.createElement(
        import_common2.ReactNative.View,
        {
          style: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16
          }
        },
        import_common2.React.createElement(import_common2.ReactNative.View, { style: { width: 40 } }),
        import_common2.React.createElement(
          T2,
          { variant: "heading-md/semibold", style: { flex: 1, textAlign: "center" } },
          "View members with role"
        ),
        ActionSheetCloseButton2 ? import_common2.React.createElement(ActionSheetCloseButton2, {
          onPress: () => hideActionSheet2?.()
        }) : import_common2.React.createElement(
          T2,
          {
            variant: "text-md/semibold",
            style: { color: import_ui2.rawColors.BRAND_500 },
            onPress: () => hideActionSheet2?.()
          },
          "Close"
        )
      ),
      import_common2.React.createElement(
        import_common2.ReactNative.ScrollView,
        { style: { maxHeight: 480 } },
        import_common2.React.createElement(
          TableRowGroup2,
          null,
          ...roles.map((role) => {
            const color = roleColorHex(role);
            return import_common2.React.createElement(TableRow2, {
              key: role.id,
              label: color ? import_common2.React.createElement(
                import_common2.ReactNative.View,
                { style: { flexDirection: "row", alignItems: "center" } },
                import_common2.React.createElement(import_common2.ReactNative.View, {
                  style: {
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: color,
                    marginRight: 8
                  }
                }),
                import_common2.React.createElement(T2, { variant: "text-md/semibold" }, role.name)
              ) : role.name,
              trailing: TableRow2.Arrow ? () => import_common2.React.createElement(TableRow2.Arrow, null) : void 0,
              onPress: () => {
                hideActionSheet2?.();
                openLazy2?.(Promise.resolve({ default: MembersPage }), "vmwr-members-" + role.id, {
                  guildId,
                  roleId: role.id,
                  roleName: role.name,
                  roleColor: color
                });
              }
            });
          }),
          roles.length === 0 ? import_common2.React.createElement(
            import_common2.ReactNative.View,
            { style: { padding: 16, alignItems: "center" } },
            import_common2.React.createElement(T2, { variant: "text-md/medium" }, "No roles found")
          ) : null
        )
      )
    );
  }

  // plugins/viewMembersWithRole/src/patches/patchServer.ts
  var GuildActionSheetProgress = (0, import_metro3.findByName)("GuildActionSheetProgress", false);
  var TableRow3 = (0, import_metro3.findByProps)("TableRow")?.TableRow;
  var TableRowGroup3 = (0, import_metro3.findByProps)("TableRowGroup")?.TableRowGroup ?? (0, import_metro3.findByProps)("TableRow")?.TableRowGroup;
  var { openLazy: openLazy3 } = (0, import_metro3.findByProps)("openLazy");
  var patchServer_default = () => {
    if (!GuildActionSheetProgress || !openLazy3 || !TableRow3 || !TableRowGroup3)
      return () => {
      };
    return (0, import_patcher.after)("default", GuildActionSheetProgress, (args, ret) => {
      const guild = args[0]?.guild;
      if (!guild)
        return;
      return import_common3.React.createElement(
        import_common3.React.Fragment,
        null,
        ret,
        import_common3.React.createElement(
          TableRowGroup3,
          null,
          import_common3.React.createElement(TableRow3, {
            label: "View members with role",
            trailing: TableRow3.Arrow ?? void 0,
            icon: TableRow3.Icon != null ? import_common3.React.createElement(TableRow3.Icon, {
              source: (0, import_assets.getAssetIDByName)("MembersIcon") ?? (0, import_assets.getAssetIDByName)("ic_members") ?? (0, import_assets.getAssetIDByName)("PeopleIcon")
            }) : void 0,
            onPress: () => openLazy3(Promise.resolve({ default: RoleListPage }), "vmwr-roles", {
              guildId: guild.id
            })
          })
        )
      );
    });
  };

  // plugins/viewMembersWithRole/src/index.ts
  var patches = [];
  var src_default = {
    onLoad: () => {
      patches.push(patchServer_default());
    },
    onUnload: () => {
      for (const unpatch of patches)
        unpatch();
      patches.length = 0;
    }
  };
  return __toCommonJS(src_exports);
})();

var _m = typeof plugin !== "undefined" ? plugin : {};
var _d = _m.default !== undefined ? _m.default : _m;
if (_d && typeof _d === "object" && _d.default && typeof _d.onLoad !== "function") _d = _d.default;
V.default = _d;
Object.defineProperty(V, "__esModule", { value: true });
return V;
})({});
