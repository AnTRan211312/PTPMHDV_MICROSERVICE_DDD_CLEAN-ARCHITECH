import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Provider } from "react-redux";
import { persistor, store } from "@/features/store";
import { setupAxiosInterceptors } from "./lib/axiosClient";
import { Toaster } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersistGate } from "redux-persist/integration/react";

const App = () => {
    setupAxiosInterceptors(store.dispatch);

    return (
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                    <ScrollArea className="h-screen">
                        <RouterProvider router={router} />
                    </ScrollArea>
                    <Toaster richColors />
            </PersistGate>
        </Provider>
    );
};

export default App;
