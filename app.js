const express = require("express");
const expressLayout = require("express-ejs-layouts");
const { body, check, validationResult } = require("express-validator");
const morgan = require("morgan");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const port = 3000;
require("./utils/db");
const Contact = require("./models/contact");

app.set("view engine", "ejs");
app.use(expressLayout);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));

app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 6000 },
  })
);
app.use(flash());

app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Bima Arya Wicaksana",
      alamat: "Depok",
      umur: 22,
    },
    {
      nama: "Hidayat",
      alamat: "Bondowoso",
      umur: 22,
    },
  ];
  res.render("index", {
    layout: "layouts/main",
    title: "Home",
    mahasiswa,
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    layout: "layouts/main",
    title: "about",
  });
});

app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contact", {
    title: "Halaman Contact",
    layout: "layouts/main",
    contacts,
    msg: req.flash("msg"),
  });
});
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Tambah kontak",
    layout: "layouts/main",
  });
});

app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error("Nama yang anda daftarkan sudah tersedia!");
      }
      return true;
    }),
    check("nama", "nama yang anda masukan tidak valid").notEmpty(),
    check("email", "email yang anda masukan tidak valid").isEmail(),
    check("nohp", "no hp yang anda masukan tidak valid").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Tambah kontak",
        layout: "layouts/main",
        errors: errors.array(),
      });
    } else {
      await Contact.insertMany(req.body);
      req.flash("msg", "Data kontak berhasil ditambahkan!");
      res.redirect("/contact");
    }
  }
);

app.get("/contact/edit/:id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id });
  res.render("edit-contact", {
    title: "Ubah kontak",
    layout: "layouts/main",
    contact,
  });
});

app.put(
  "/contact",
  [
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama yang anda daftarkan sudah tersedia!");
      }
      return true;
    }),
    // check("nama", "nama yang anda masukan tidak valid").notEmpty(),
    check("email", "email yang anda masukan tidak valid").isEmail(),
    check("nohp", "no hp yang anda masukan tidak valid").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-contact", {
        title: "ubah kontak",
        layout: "layouts/main",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      await Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      );
      req.flash("msg", "Data kontak berhasil diubah!");
      res.redirect("/contact");
    }
  }
);

app.delete("/contact", async (req, res) => {
  await Contact.deleteOne({ _id: req.body.idcontact });
  req.flash("msg", "Data kontak berhasil dihapus!");
  res.redirect("/contact");
});

app.get("/contact/:id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id });
  res.render("detail", {
    title: "Halaman Detail Contact",
    layout: "layouts/main",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Server is listening in port http://localhost:${port}`);
});
