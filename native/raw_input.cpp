#include <napi.h>
#include <windows.h>
#include <thread>
#include <atomic>
#include <unordered_map>

Napi::ThreadSafeFunction tsfn;
std::thread workerThread;
std::atomic<bool> running(false);
HWND hwndHidden = NULL;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_INPUT) {
        UINT dwSize = 0;
        GetRawInputData((HRAWINPUT)lParam, RID_INPUT, NULL, &dwSize, sizeof(RAWINPUTHEADER));
        LPBYTE lpb = new BYTE[dwSize];
        if (lpb != NULL) {
            if (GetRawInputData((HRAWINPUT)lParam, RID_INPUT, lpb, &dwSize, sizeof(RAWINPUTHEADER)) == dwSize) {
                RAWINPUT* raw = (RAWINPUT*)lpb;
                if (raw->header.dwType == RIM_TYPEMOUSE) {
                    HANDLE deviceHandle = raw->header.hDevice;
                    LONG lastX = raw->data.mouse.lLastX;
                    LONG lastY = raw->data.mouse.lLastY;
                    USHORT usFlags = raw->data.mouse.usButtonFlags;

                    int leftDown = (usFlags & RI_MOUSE_LEFT_BUTTON_DOWN) ? 1 : ((usFlags & RI_MOUSE_LEFT_BUTTON_UP) ? 0 : -1);
                    int middleDown = (usFlags & RI_MOUSE_MIDDLE_BUTTON_DOWN) ? 1 : ((usFlags & RI_MOUSE_MIDDLE_BUTTON_UP) ? 0 : -1);

                    auto callback = [deviceHandle, lastX, lastY, leftDown, middleDown](Napi::Env env, Napi::Function jsCallback) {
                        Napi::Object obj = Napi::Object::New(env);
                        obj.Set("deviceId", Napi::Number::New(env, (uintptr_t)deviceHandle));
                        obj.Set("deltaX", Napi::Number::New(env, lastX));
                        obj.Set("deltaY", Napi::Number::New(env, lastY));
                        obj.Set("leftState", Napi::Number::New(env, leftDown));
                        obj.Set("middleState", Napi::Number::New(env, middleDown));
                        jsCallback.Call({ obj });
                    };
                    tsfn.NonBlockingCall(callback);
                }
            }
            delete[] lpb;
        }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

void RawInputWorker() {
    WNDCLASS wc = { 0 };
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = L"RawInputWorkerClass";
    RegisterClass(&wc);

    hwndHidden = CreateWindowEx(0, L"RawInputWorkerClass", L"RawInputWindow", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, NULL, NULL);

    RAWINPUTDEVICE rid;
    rid.usUsagePage = 0x01; // Generic Desktop Controls
    rid.usUsage = 0x02;     // Mouse
    rid.dwFlags = RIDEV_INPUTSINK;
    rid.hwndTarget = hwndHidden;

    RegisterRawInputDevices(&rid, 1, sizeof(rid));

    MSG msg;
    while (running && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

Napi::Value StartListening(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Callback function expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    tsfn = Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "RawInputTSFN", 0, 1);
    running = true;
    workerThread = std::thread(RawInputWorker);
    return Napi::Boolean::New(env, true);
}

Napi::Value StopListening(const Napi::CallbackInfo& info) {
    running = false;
    if (hwndHidden) PostMessage(hwndHidden, WM_CLOSE, 0, 0);
    if (workerThread.joinable()) workerThread.join();
    tsfn.Release();
    return info.Env().Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startListening", Napi::Function::New(env, StartListening));
    exports.Set("stopListening", Napi::Function::New(env, StopListening));
    return exports;
}

NODE_API_MODULE(raw_input, Init)
