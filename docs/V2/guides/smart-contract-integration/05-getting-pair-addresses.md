---
id: getting-pair-addresses
title: Pair Addresses
---

# getPair

The most obvious way to get the address for a pair is to call [getPair](../../reference/smart-contracts/factory#getpair)
on the factory. If the pair exists, this function will return its address,
else `address(0)` (`0x0000000000000000000000000000000000000000`).

- The "canonical" way to determine whether or not a pair exists.
- Requires an on-chain lookup.

# CREATE2

Thanks to
some [fancy footwork in the factory](../../../../contracts/core/DonkeV2Factory.sol#L32),
we can also compute pair addresses _without any on-chain lookups_ because
of [CREATE2](https://eips.ethereum.org/EIPS/eip-1014). The following values are required for this technique:

|                        |                                                                        |
|:-----------------------|:-----------------------------------------------------------------------|
| `address`              | The [factory address](../../reference/smart-contracts/factory#address) |
| `salt`                 | `keccak256(abi.encodePacked(token0, token1))`                          |
| `keccak256(init_code)` | `0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9`   |

- `token0` must be strictly less than `token1` by sort order.

* Can be computed offline.
* Requires the ability to perform `keccak256`.

## Examples

### Solidity

```solidity
address factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
address token0 = 0xCAFE000000000000000000000000000000000000; // change me!
address token1 = 0xF00D000000000000000000000000000000000000; // change me!

address pair = address(uint(keccak256(abi.encodePacked(
hex'ff',
factory,
keccak256(abi.encodePacked(token0, token1)),
hex'6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9'
))));
```
