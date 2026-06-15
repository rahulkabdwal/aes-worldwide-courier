import Container from "../common/Container";

export default function Footer() {
  return (
    <footer className="border-t border-line py-12 mt-32">
      <Container>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} AES Worldwide Courier. All rights
          reserved.
        </p>
      </Container>
    </footer>
  );
}
