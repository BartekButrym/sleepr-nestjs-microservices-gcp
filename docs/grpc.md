Kompilacja pliku Protocol Buffers (`.proto`) do kodu TypeScript kompatybilnego z NestJS:

```sh
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./ --ts_proto_opt=nestJs=true ./proto/auth.proto
```

ta komenda wygeneruje plik TypeScript zawierający:

- Interfejsy TypeScript odpowiadające message'om z proto
- Definicje serwisów kompatybilne z NestJS
- Typy do komunikacji gRPC
- Metadata potrzebna do serializacji/deserializacji
