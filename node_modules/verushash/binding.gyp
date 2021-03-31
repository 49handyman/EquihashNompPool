{
    "targets": [
        {
            "target_name": "verushash",
            "dependencies": [
            ],
            "sources": [
                "crypto/common.h",
                "crypto/haraka.h",
                "crypto/haraka_portable.h",
                "crypto/verus_clhash.h",
                "crypto/verus_hash.h",
                "crypto/haraka.c",
                "crypto/haraka_portable.c",
                "crypto/tinyformat.h",
                "crypto/uint256.cpp",
                "crypto/uint256.h",
                "crypto/utilstrencodings.cpp",
                "crypto/utilstrencodings.h",
                "crypto/verus_hash.cpp",
                "crypto/verus_clhash.cpp",
                "crypto/verus_clhash_portable.cpp",
                "verushash.cc",
            ],
            "include_dirs": [
                "<!(nodejs -e \"require('nan')\")",
            ],
            "defines": [
            ],
            "cflags_cc": [
                "-std=c++11",
                "-Wl,--whole-archive",
                "-fPIC",
                "-fexceptions",
                "-Ofast",
                "-march=native",
                "-msse4",
                "-msse4.1",
                "-msse4.2",
                "-mssse3",
                "-mavx",
                "-mpclmul",
                "-maes",
            ],
            "cflags": [
                "-Wl,--whole-archive",
                "-fPIC",
                "-fexceptions",
                "-Ofast",
                "-march=native",
                "-msse4",
                "-msse4.1",
                "-msse4.2",
                "-mssse3",
                "-mavx",
                "-mpclmul",
                "-maes",
            ],
            "link_settings": {
                "libraries": [
                    "-Wl,-rpath,./build/Release/",
                ]
            },
            "conditions": [
                ['OS=="mac"', {
                    'xcode_settings': {
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
                    }
                }]
            ]
        }
    ]
}
