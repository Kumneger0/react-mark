import { routeChanged } from "../link";

interface FikerRouterInstance {
  /**
   * Pushes a new URL to the history stack and navigates to it
   * @see https://fiker.com/docs/router#push
   */
  push: (url: string) => void;

  /**
   * Replaces the current URL in history with a new one without adding a new entry
   * @see https://fiker.com/docs/router#replace
   */
  replace: (url: string) => void;

  /**
   * Navigates to the previous page in the history stack
   * @see https://fiker.com/docs/router#back
   */
  back: () => void;

  /**
   * Navigates to the next page in the history stack
   * @see https://fiker.com/docs/router#forward
   */
  forward: () => void;
}

const push = (url: string) => {
  if (typeof window !== undefined) {
    window.history.pushState({}, "", url);
    window.dispatchEvent(routeChanged);
  }
};

const replace = (url: string) => {
  if (typeof window !== undefined) {
    window.history.replaceState({}, "", url);
    window.dispatchEvent(routeChanged);
  }
};

const back = () => {
  if (typeof window !== undefined) {
    window.history.back();
    window.dispatchEvent(routeChanged);
  }
};
const forward = () => {
  if (typeof window !== undefined) {
    window.history.forward();
    window.dispatchEvent(routeChanged);
  }
};

export const useRouter = (): FikerRouterInstance => {
  return {
    push,
    replace,
    back,
    forward,
  };
};

// if (typeof window !== undefined) {
//   window?.addEventListener("routeChanged", async (e) => {
//     const pathname = window.location.pathname;
//     const response = await fetch(`/getssr?pathname=${pathname}`);
//     const filePath = await response.text();
//     const { default: App } = await import(filePath);
//     window?.App = App;
//     window?.dispatchEvent(updatePageEvent);
//   });
// }
