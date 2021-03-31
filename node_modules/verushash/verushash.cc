#include <nan.h>
#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <stdint.h>
#include <vector>

#include "crypto/verus_hash.h"

using namespace v8;

CVerusHash* vh;
CVerusHashV2* vh2;
CVerusHashV2* vh2b1;
CVerusHashV2* vh2b2;

bool initialized = false;

void initialize()
{
    if (!initialized)
    {
        CVerusHash::init();
        CVerusHashV2::init();
    }
    
    vh = new CVerusHash();
    vh2 = new CVerusHashV2(SOLUTION_VERUSHHASH_V2);
    vh2b1 = new CVerusHashV2(SOLUTION_VERUSHHASH_V2_1);
	vh2b2 = new CVerusHashV2(SOLUTION_VERUSHHASH_V2_2);
    
    initialized = true;
}

void verusInit(const v8::FunctionCallbackInfo<Value>& args) {
    initialize();
    args.GetReturnValue().Set(args.This());
}

void verusHash(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    if (args.Length() < 1) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments"))
        );
        return;
    }
    MaybeLocal<Object> maybeBuffer = Nan::To<v8::Object>(args[0]);
    Local<Object> buffer;
    if (maybeBuffer.ToLocal(&buffer) != true) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }
    if(!node::Buffer::HasInstance(buffer)) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }

    const char *buff = node::Buffer::Data(buffer);

    char *result = new char[32];
    
    if (initialized == false) {
        initialize();
    }
    verus_hash(result, buff, node::Buffer::Length(buffer));
    args.GetReturnValue().Set(Nan::NewBuffer(result, 32).ToLocalChecked());
}

void verusHashV2(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    if (args.Length() < 1) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments"))
        );
        return;
    }
    MaybeLocal<Object> maybeBuffer = Nan::To<v8::Object>(args[0]);
    Local<Object> buffer;    
    if (maybeBuffer.ToLocal(&buffer) != true) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }
    if(!node::Buffer::HasInstance(buffer)) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }

    const char *buff = node::Buffer::Data(buffer);

    char *result = new char[32];
    
    if (initialized == false) {
        initialize();
    }

    vh2->Reset();
    vh2->Write((const unsigned char *)buff, node::Buffer::Length(buffer));
    vh2->Finalize((unsigned char *)result);
    args.GetReturnValue().Set(Nan::NewBuffer(result, 32).ToLocalChecked());
}

void verusHashV2b(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    if (args.Length() < 1) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments"))
        );
        return;
    }
    MaybeLocal<Object> maybeBuffer = Nan::To<v8::Object>(args[0]);
    Local<Object> buffer;    
    if (maybeBuffer.ToLocal(&buffer) != true) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }
    if(!node::Buffer::HasInstance(buffer)) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }

    const char *buff = node::Buffer::Data(buffer);

    char *result = new char[32];
    
    if (initialized == false) {
        initialize();
    }

    vh2->Reset();
    vh2->Write((const unsigned char *)buff, node::Buffer::Length(buffer));
    vh2->Finalize2b((unsigned char *)result);
    args.GetReturnValue().Set(Nan::NewBuffer(result, 32).ToLocalChecked());
}

void verusHashV2b1(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    if (args.Length() < 1) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments"))
        );
        return;
    }
    MaybeLocal<Object> maybeBuffer = Nan::To<v8::Object>(args[0]);
    Local<Object> buffer;    
    if (maybeBuffer.ToLocal(&buffer) != true) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }
    if(!node::Buffer::HasInstance(buffer)) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }

    const char *buff = node::Buffer::Data(buffer);

    char *result = new char[32];
    
    if (initialized == false) {
        initialize();
    }

    vh2b1->Reset();
    vh2b1->Write((const unsigned char *)buff, node::Buffer::Length(buffer));
    vh2b1->Finalize2b((unsigned char *)result);
    args.GetReturnValue().Set(Nan::NewBuffer(result, 32).ToLocalChecked());
}

void verusHashV2b2(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    if (args.Length() < 1) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments"))
        );
        return;
    }
    MaybeLocal<Object> maybeBuffer = Nan::To<v8::Object>(args[0]);
    Local<Object> buffer;    
    if (maybeBuffer.ToLocal(&buffer) != true) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }
    if(!node::Buffer::HasInstance(buffer)) {
        isolate->ThrowException(
            Exception::TypeError(String::NewFromUtf8(isolate, "Invalid buffer objects."))
        );
        return;
    }

    const char *buff = node::Buffer::Data(buffer);

    char *result = new char[32];
    
    if (initialized == false) {
        initialize();
    }

    vh2b2->Reset();
    vh2b2->Write((const unsigned char *)buff, node::Buffer::Length(buffer));
    vh2b2->Finalize2b((unsigned char *)result);
    args.GetReturnValue().Set(Nan::NewBuffer(result, 32).ToLocalChecked());
}

void Init(Handle<Object> exports) {
  NODE_SET_METHOD(exports, "init", verusInit);

  NODE_SET_METHOD(exports, "hash", verusHash);          //VerusHash V1
  NODE_SET_METHOD(exports, "hash2", verusHashV2);       //VerusHash V2
  NODE_SET_METHOD(exports, "hash2b", verusHashV2b);     //VerusHash V2B
  NODE_SET_METHOD(exports, "hash2b1", verusHashV2b1);   //VerusHash V2B1
  NODE_SET_METHOD(exports, "hash2b2", verusHashV2b2);   //VerusHash V2B2
}

NODE_MODULE(verushash, Init)
