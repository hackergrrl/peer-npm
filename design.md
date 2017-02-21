# WHY would someone want something like this?

- I want to publish my package to npm AND "the swarm" so that my package is more
  reliably available
- I want an easy way to use/publish/install packages when I'm offline
- I want to be able to install/share packages /w my friends over LAN
- I want my packages to be available & resistant to censorship
- I want a package manager whose backend is 100% permissively open source
- I think the future of the node community doesn't belong in the hands of a
  for-profit company
- I want a fail-safe in case npm Inc ever goes belly-up or is seized by the
  government


# How could developers use peer-npm?

1. Exclusively: `peer-npm publish --recursive` publishes both my package and all
   of its dependencies to the swarm. I and users can use my package and any of
   its (pinned?) deps without npm.
2. Both; npm preferred: I publish my package and its deps to the swarm, but for
   development and everyday use, I use `npm` and centralized dependencies.
3. Both; peer-npm preferred: ???


# Interoperation of peer-npm and npm

1. Does running `peer-npm install` in a directory install JUST swarm packages,
   or also npm ones?
2. Can I use `peer-npm SUBCOMMAND` on any package, or just swarm ones?
3. Can I define clear boundaries between `peer-npm` and `npm`, or do I need to
   make `peer-npm` layer nicely over top of `npm`?
4. Does using `peer-npm` "poison the well"? Can I not go back to using vanilla
   `npm` now that I have swarm deps in my `package.json`?

## Interop FAQ

### How do I get started?

Install `peer-npm` and keep the peering node running in the background.

```
$ npm install -g peer-npm

$ peer-npm daemon
```

Now you can publish an existing package of yours using `peer-npm publish`, or
install swarm dependencies using `peer-npm install`.

Swarm dependencies look different than regular npm names. They are a
concatenation of a human-readable name and a public key, like

```
field-trip_79cf7ecc9baf627642099542b3714bbef
```

This name is both readable by humans, and also uniquely and verifiably
identifies a package. Simply run

```
$ peer-npm install field-trip_79cf7ecc9baf627642099542b3714bbef
```

and use the module just as you would any regular npm dependency.

Publishing is just as easy as vanilla `npm`:

```
$ peer-npm publish
 + field-trip_79cf7ecc9baf627642099542b3714bbef@1.2.1
```

By default, all of the package's dependencies also published to the swarm, and
the dependencies are rewritten to reflect this, not unlike `npm shrinkwrap`
(TODO: check this). If you don't want this behaviour and only want the top-level
package published to the swarm, use `peer-npm publish --shallow`.


### Can I publish to the swarm, but keep using npm otherwise?

Yes. When ready to publish, run

```
peer-npm publish && npm publish
```

to publish, and share the resulting package name with friends/family/felines.
This will publish your package AND all of its dependencies to the swarm.

Your `package.json` will *not* be modified.

### Can I publish my package to the swarm but keep npm dependencies?

Yes. Use

```
peer-npm publish --shallow
```

to keep npm dependencies intact.

### I cloned a repo that has swarm and npm dependencies. How do I proceed?

`peer-npm` understands both types, and can tell which is which. Simply run

```
peer-npm install
```

And both types of dependencies will be installed.

### Someone gave me the name of their swarm package. How do I depend on it?

Install it just like you would with `npm`, but using `peer-npm`:

```
peer-npm install -S field-trip_79cf7ecc9baf627642099542b3714bbef
```

### Do I have to use the peer-npm command for everything now?

If you wish to install a package that depends on swarm dependencies, you MUST
use `peer-npm install`.

Otherwise, for npm subcommands that operate on a specific package, use
`peer-npm` for swarm dependencies, and `npm` for the rest.

Things like `peer-npm info FOO` will work, while others, like `peer-npm star
FOO` will not.

### How do I use peer-npm and the swarm exclusively?

1. create a brand new directory & package (I like `pkginit`)
2. install dependencies using `peer-npm install -S <package-name_publickey>`
3. when you're ready to share, run `peer-npm publish` and share the resulting
   identifier with friends/family/felines.
4. everyone else using peer-npm can now install your package with `peer-npm
   install <your package identifier>`!

## How do I find packages? Is there a search feature?

TODO: this

## How can I have a hybrid package that others can use npm with but peer-npm users can rely on the swarm?

`peer-npm` stores all p2p network dependencies under a special key of
`package.json` that stock `npm` does not look at: `swarmDependencies`.

This means you can continue to use `npm` as per normal, but rely on peer network
for fetching dependencies if you choose to use `peer-npm`. peer-npm won't
"poison" your `package.json` in such a way that `npm` ceases to function.

## How will interop work with other p2p networks?

A swarm package is identified by its name, the network it resides on, and a
unique identifier. A package on hyperdrive, for example, might be

```
airfile_hdrive_ac06be2400c40f2c90f5f5282d57877b2de1674f5a736d3d9ae7c29e491d1a5c
```


# npm adduser

This generates a new public key and places it in
`$HOME/.peer-npm/key.{pub,prv}`. This is used for future publishing. Users ought
not lose this.


# Installing a package

Behave like `npm`, except package names are their name concatenated with the
hex-string of the publisher's public key.

The package is placed in `node_modules` like any other module, and is structured
identically.

```
$ nps i -S field-trip_79cf7ecc9baf627642099542b3714bbef

$ cat package.json
...
  "dependencies": {
    "field-trip_79cf7ecc9baf627642099542b3714bbef": "^1.2.0"
  },
...
```

# Publishing a package

Same syntax as `npm`, except the package and its tarball goes to the swarm.

By default, dependencies are *not* also published. However, the user can provide
`--recursive` to also published pinned dependencies to the swarm.

```
$ nps publish
 + field-trip_79cf7ecc9baf627642099542b3714bbef@1.2.1
```


# Security concerns

## Name phishing via npm

Someone could publish a package on npm with the same name as a package on
peer-npm that is compromised. If a user got confused and used npm where they
should have used peer-npm, they'd install the compromised package.


# See Also

This is hardly a new idea!

- http://everythingstays.com
- https://github.com/ipmjs/ipmjs
- https://github.com/elsehow/gx-js
- https://github.com/sterpe/gx-js
- https://github.com/dominictarr/npmd
- https://github.com/ipfs/ipfs-npm/
- https://github.com/diasdavid/npm-on-ipfs
- https://github.com/watson/npm-to-hypercore

