# merkle-bitcoin
Bitcoin-style merkle root generation.

# Usage

```
npm install merkle-bitcoin
```

``` js
var merkle = require('merkle-bitcoin');
```

# Examples

#### Even number of transactions
``` js
// Generate the merkle root for block #80000
var hashes = [
  "c06fbab289f723c6261d3030ddb6be121f7d2508d77862bb1e484f5cd7f92b25",
  "5a4ebf66822b0b2d56bd9dc64ece0bc38ee7844a23ff1d7320a88c5fdb2ad3e2"
];

merkle(hashes, function (err, merkleTree) {
  console.log(merkleTree.root);
  // 8fb300e3fdb6f30a4c67233b997f99fdd518b968b9a3fd65857bfe78b2600719 
});
```

#### Odd number of transactions
``` js
// Generate the merkle root for block #50001
var hashes = [
    "e1882d41800d96d0fddc196cd8d3f0b45d65b030c652d97eaba79a1174e64d58",
    "7940cdde4d713e171849efc6bd89939185be270266c94e92369e3877ad89455a",
    "f84761459a00c6df3176ae5d94c99e69f25100d09548e5686bd0c354bb8cc60a"
];

merkle(hashes, function (err, merkleTree) {
  console.log(merkleTree.root);
  // ee3a2d2b895cafacff526d06a55b55e049cf84a9735e4a63f7fd08f96d0f4649 
});
```
