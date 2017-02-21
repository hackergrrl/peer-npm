# peer-npm

> an npm-compatible registry backed by peer-to-peer networks

**NOTE**: This is just a WIP experiment and barely works; please adjust
expectations accordingly.

TODO: write-up


## WHY would someone want something like this?

- I want an easy way to use/publish/install packages when I'm offline
- I want to be able to install/share packages /w my friends over LAN
- I want my packages to be available & resistant to censorship & network failure
- I want a fail-safe in case npm Inc ever goes away or is seized by the government
- I want a package manager whose backend is 100% permissively open source



## Usage

To be used just like vanilla `npm`, but with a subset of commands: `install`,
`publish`, and `adduser`.

```
USAGE:

  peer-npm i, install [-S] [-D]

    Works like `npm install`. Accepts a peer-npm package name to install from
    the swarm.

  peer-npm publish

    Works like `npm publish`. Publish the current package to the swarm.

  peer-npm adduser

    Required to be run before use. The information provided appears in the
    `author` metadata, but is otherwise inconsequential.

```

## Getting started

### Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install --global peer-npm
```

### Generate a private/public keypair

These keys serve as your identity in the swarm. Run

```
$ peer-npm adduser
```

and fill in the fields. The password is unused, and the other fields are only to
populate the `author` metadata in the packages you publish.

### Join the swarm

In another window run

```
$ peer-npm daemon
```

so that you can download packages from others and share the ones you publish.

### Republish a module to the swarm

Navigate to a node package's directory (the one with `package.json`) and run

```
$ peer-npm publish
+ foobar_ac06be2400c40f2c90f5f5282d57877b2de1674f5a736d3d9ae7c29e491d1a5c
Published 0.0.4
```

Once published, it will output the name of your package, concatenated with your
public key. These together form the unique name of your package in the swarm.

### Install a package

Let's install a package, via the swarm! Navigate to `/tmp` and run

```
$ peer-npm install peer-npm_f052af309e32af0fa3b4309293b5350a00acc6a2a583b28a3a53fdf88197ead9
```

This will install `peer-npm` itself from other peer-npm users over the internet,
or local network.


## How does it work?

`peer-npm` pretends to be an npm registry, but running on your local machine.
When you run `peer-npm daemon` it runs this registry (and also does the peering
logic).

`peer-npm install` is mostly a wrapper for something like `npm install
--registry=http://localhost:9000`.

When you publish or try to install a package, `peer-npm` looks at its name to
decide whether it is a package from the central npm registry, or from the swarm.

npm packages have a name like `field-trip`, whereas swarm packages have a name
like `field-trip_79cf7ecc9baf627642099542b3714bbef`. The part after the name is
the public key of the author. This makes packages resiliant against
impersonation or malicious peers.

`peer-npm` can work with different peer networks; right now there is only a
[hyperdrive](https://github.com/mafintosh/hyperdrive) driver, which is the
default.

When you run `peer-npm install` it will find other peers with the packages you
want and download them, recursively down the dependency tree. Similarly, when
you run `peer-npm publish`, the new package's key is shared amongst other
`peer-npm` peers for future discovery.

## License

ISC

