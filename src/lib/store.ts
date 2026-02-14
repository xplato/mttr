import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("store.json", {
  defaults: {
    theme: "system",
  },
});

export default store;
