import { defineConfig } from "eslint/config"
import datConfig from "eslint-config-dat"

export default defineConfig([
    {
        files: ["**/*.ts", "test/*.js"],
        extends: [datConfig]
    },
    {
        ignores: ["dist/*"] // node_modules ignored by default
    },
])
