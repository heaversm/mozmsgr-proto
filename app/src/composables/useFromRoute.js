import { onBeforeRouteUpdate, useRoute } from "vue-router";

export const useFromRoute = (fn) => {
  //fire events when we enter a route and also when route updates
  fn(useRoute(), null);
  onBeforeRouteUpdate((to, from, next) => {
    fn(to, from);
    next();
  });
};
