import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [index("routes/home.tsx"), route(":role", "routes/portal.tsx", [index("routes/dashboard.tsx"), route(":section", "routes/section.tsx")])] satisfies RouteConfig;
