# peer-npm

> an npm-compatible registry backed by peer-to-peer networks

**NOTE**: Very unstable and mad science-y. Use at your own discretion.

## Project Goals

1. The official npm package registry should remain a valid, legitimate registry, but no longer be *required* for node package management.
2. Users of peer-npm form a swarm: a peer-to-peer network where node packages are shared communally without a centralized source.
3. Anyone can use their machine's local npm package cache to serve packages to the rest of the swarm.
4. Users can install node packages over P2P networks, over local networks, and offline from their local machine.
5. peer-npm is readily hackable, so that adding new ways to share packages is easy. (Bluetooth? Sound waves? USB key sneakernets?)
6. Using peer-npm with your packages won't break your work: vanilla `npm` will keep on working.


## WHY would someone want something like this?

- I want an easy way to use/publish/install packages when I'm offline
- I want to be able to install/share packages /w my friends over LAN
- I want my packages to be available & resistant to censorship & network failure
- I want a fail-safe in case npm Inc ever goes away or is seized by the
  government
- I want a package manager whose backend is 100% permissively open source

## Usage

To be used just like vanilla `npm`, but with a subset of commands: `install`,
`remove`, and `publish`.

```
USAGE:

  peer-npm i, install [-S] [-D]

    Works like `npm install`. Accepts a peer-npm package name to install from
    the swarm.

  peer-npm publish

    Works like `npm publish`. Publish the current package to the swarm.
    Generates a new keypair if one is not already present.

```

## Getting started

### Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install --global peer-npm
```

### Join the swarm

In another window run

```
$ peer-npm daemon
```

so that you can download packages from others and share the ones you publish.

### Publish a module to the swarm

Let's grab a package from github and try to publish it:

```
$ cd /tmp

$ git clone https://github.com/noffle/resync-srt

$ cd resync-srt

$ npm install

$ peer-npm publish
+ resync-srt_hyperdrive_c5abee5fd496620499c3d203f15c95d24a51d16ec05dea4a8ab2c88368c296b9
Published 3.1.0
```

`resync-srt` is now in the swarm! The name of the package is made of three
parts, concatenated by underscores: the package name, the peer network its
shared on, and the public key of the publisher.

### Install a swarm dependency

Let's make a new package that depends on `resync-srt`:

```
$ cd /tmp
$ mkdir foobar
$ cd foobar

$ npm init

# you'll want to use the package name generated from the last step
$ peer-npm install --save resync-srt_hyperdrive_c5abee5fd496620499c3d203f15c95d24a51d16ec05dea4a8ab2c88368c296b9
```

If you look in your `package.json` you'll see a new section called
`swarmDependencies`. This lets `peer-npm` know what packages you depend on in
the swarm, but in a way that keeps vanilla `npm` working.

In fact, you can have a package in both `swarmDependencies` *and* regular
`dependencies`. Using `peer-npm` won't break your package for non-`peer-npm`
users.


## How does it work?

### Key Concepts

- A **registry** is any source that can do two things:
  1. Answer the question "give me the metadata for the package named X"
  2. (optionally) Receive the `package.json` and tarball of a new package to be published.
- A **blob store** is any source that can do two things:
  1. Supply the tarball whose checksum matches the requested SHA-1 hash.
  2. (optionally) Receive a tarball and make it available by its SHA-1 hash.

[npmjs.org](https://npmjs.org) is a source that provides both of these things: you can find packages by name, publish packages, and also get/put tarballs for those packages.

What about other sources? Not everyone has a high speed internet connection available to them at all times. There are many alternatives for getting package data from one computer to another today, like peer-to-peer networks or multicast DNS.

### Overview

`peer-npm` pretends to be an npm registry, but running on your local machine.
When you run `peer-npm daemon` it runs this registry (and also does the peering
logic).

`peer-npm install` is mostly a wrapper for something like `npm install
--registry=http://localhost:9000`.

When you publish or try to install a package, `peer-npm` looks at its name to
decide whether it is a package from the central npm registry, or from the swarm.

npm packages have a name like `field-trip`, whereas swarm packages have a name
like `field-trip_hyperdrive_79cf7ecc9baf627642099542b3714bbef`. The part after
the name is the public key of the author. This makes packages resiliant against
impersonation or malicious peers.

`peer-npm` can work with different peer networks; right now there is only a
[hyperdrive](https://github.com/mafintosh/hyperdrive) driver, which is the
default.

When you run `peer-npm install` it will find other peers with the packages you
want and download them, recursively down the dependency tree. Similarly, when
you run `peer-npm publish`, the new package's key is shared amongst other
`peer-npm` peers for future discovery.

## IRC

Come hang out in `#peer-npm` on Freenode to help test and develop!

## License

ISC

