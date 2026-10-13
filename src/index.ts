import patchServer from "./patches/patchServer";

const patches: (() => void)[] = [];

export default {
    onLoad: () => {
        patches.push(patchServer());
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
};
