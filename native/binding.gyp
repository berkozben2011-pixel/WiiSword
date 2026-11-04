{
  "targets": [
    {
      "target_name": "raw_input",
      "sources": [ "raw_input.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('node-addon-api').include\")"
      ],
      "libraries": [ "User32.lib" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}
