# LeadKnight

LeadKnight is a WireGuard GraphQL API written in NodeJS express. It allows you to interact with the WireGuard endpoint with GraphQL queries.

Leadknight can keep track of peer and user usage data (upload, download, time used) across reloads by using MongoDB.

You can set limits (time, data) to peers, assign them to users, and limit the users.

LeadKnight will automatically disable the peers once they exceed their limits, and will disable users if they exceed their limits.

## Deploy

### Install

1. `git clone https://github.com/EchoEkhi/lead-knight`

2. `cd lead-knight`

3. `npm i` to install dependencies.

4. Set up a MongoDB database to be used with the API.

5. Add and edit the .env file to configure it for your own server. A `.env-example` file is provided.

6. Install WireGuard on your machine. Format the wg0.conf file as shown in `wg-example.conf` file.

7. `sudo node .` or set up your own service.

### Security

#### Access Control

There are **no built-in authentications** in this API. Do **not** expose this API to the internet! All requests will be treated with highest clearance!

Recommended setup is with a firewall to block the API port from outside traffic and tunnel in with a WireGuard tunnel. Set IP address whitelist to the WireGuard tunnel's allowedIP value, and connect your controller server to the API server. ~~You're installing WireGuard anyways why not use it VPN stands for Virtual Private Network after all~~

#### System Permissions

Because this API interacts with WireGuard on the command-line, it requires **root permission**. Execute `node` with `sudo` or as the root user.

## About

### Name

A **Wire** is also known as a lead, and a knight **Guard**s.
Lead Knight is also the **heroic leader** of your VPN strategy, hence the name. ~~Yeah I hate my puns please shut up now the name WG-API is already taken up by a REST API and I don't like using that~~

## Documentation

For a complete list of functions, enable GraphiQL and read the docs there. Only a brief overview of advanced concepts are shown here.

### Manage Peers

Each `peer`, aside from its necessary attributes (`publicKey`, `allowedIP`, etc.), also has usage information in it, e.g. `upload`, `download`, `timeUsed`. This value is checked periodically (defined in `.env` file) by the API by sending commands to WG CLI. Usage information will survive reloads. It can be cleared using the `clearPeers` mutation.

Peers can be **enabled and disabled** by setting its `enabled` attribute. Disabling a peer will remove the peer from the WG CLI and enabling it will add it back. Upon API reload, only enabled peers will be loaded back into WG CLI.

Peers can also have built-in limits, e.g. `dataLimit` and `timeLimit`. The API will automatically disable the peer once the limit is reached.

Each peer can have a `description` string to indicate its purpose, and/or a `device` string to indicate which device it belongs to.

### Manage Users

Users are used to track ownership of peers. It has many of the functionalities of the `peer` object (refer to documantation in GraphiQL), with an additional `peerLimit` to limit how many peers it can own.

Users also have `upload`, `download` and `timeUsed`, which is calculated by the sum of all peers belonging to them. `clearUsers` can be used to clear all of the user's peers' usage information.

Users have `dataLimit` and `timeLimit` as well, and that is checked against the user's own `upload`, `download` and `timeUsed`. When a limit is reached, **all** of the user's peers will be disabled.

## Context

This is my first GraphQL project. Feel free to point out any implementation errors with a GitHub issue, and make a pull request if you want to change something!
