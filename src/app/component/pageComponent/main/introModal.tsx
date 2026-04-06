import styles from './introModal.module.css';

const IntroModal = () => {
    return (
        <div className={styles.container}>
            {/* ── WHOAMI ── */}
            <section className={styles.section}>
                <div className={styles.sectionTitle}>&gt; WHOAMI</div>
                <div className={styles.line}>
                    <span className={styles.key}>NAME</span>
                    <span className={styles.val}>이학송 <span className={styles.level}>(Ma_Dev)</span></span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>ROLE</span>
                    <span className={styles.val}>Full-Stack Web Developer <span className={styles.level}>4년 6개월 경력 / 이직 준비 중</span></span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>BIO</span>
                    <span className={styles.val}>프론트·백엔드 풀스택 웹 개발자입니다.</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>&nbsp;</span>
                    <span className={styles.val}>실무 외에도 직접 서버를 구축하며 인프라 영역을 넓히고 있습니다.</span>
                </div>
            </section>

            <div className={styles.divider} />

            {/* ── SKILLS ── */}
            <section className={styles.section}>
                <div className={styles.sectionTitle}>&gt; SKILLS</div>
                <div className={styles.line}>
                    <span className={styles.key}>Frontend</span>
                    <span className={styles.val}>Next.js · React · TypeScript · CSS</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Backend</span>
                    <span className={styles.val}>Node.js · Express · MongoDB</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Infra</span>
                    <span className={styles.val}>Docker · Nginx · Linux <span className={styles.level}>[학습 중]</span></span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>경험</span>
                    <span className={styles.val}>Kafka · Logstash · Elasticsearch <span className={styles.level}>[구축 경험]</span></span>
                </div>
            </section>

            <div className={styles.divider} />

            {/* ── CAREER ── */}
            <section className={styles.section}>
                <div className={styles.sectionTitle}>&gt; CAREER</div>
                <div className={styles.careerItem}>
                    <span className={styles.period}>2023.06 ~ 2025.12</span>
                    <div className={styles.careerDetail}>
                        <span className={styles.company}>모카컴퍼니</span>
                        <span className={styles.careerDesc}>탄소배출 HIVE 웹사이트, 해외 의뢰 플랫폼 풀스택 개발</span>
                    </div>
                </div>
                <div className={styles.careerItem}>
                    <span className={styles.period}>2022.07 ~ 2023.05</span>
                    <div className={styles.careerDetail}>
                        <span className={styles.company}>세종아이티</span>
                        <span className={styles.careerDesc}>국민은행 서버 모니터링 및 전산 업무</span>
                    </div>
                </div>
                <div className={styles.careerItem}>
                    <span className={styles.period}>2020.12 ~ 2021.11</span>
                    <div className={styles.careerDetail}>
                        <span className={styles.company}>비엠엠</span>
                        <span className={styles.careerDesc}>KT DS 웹사이트 고도화 개발 및 유지보수</span>
                    </div>
                </div>
            </section>

            <div className={styles.divider} />

            {/* ── BLOG SPEC ── */}
            <section className={styles.section}>
                <div className={styles.sectionTitle}>&gt; BLOG.SPEC</div>
                <div className={styles.line}>
                    <span className={styles.key}>Runtime</span>
                    <span className={styles.val}>Next.js 14 — App Router / RSC</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Database</span>
                    <span className={styles.val}>MongoDB (Mongoose ODM)</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Hosting</span>
                    <span className={styles.val}>Oracle Cloud (OCI) — ARM 4core / 24 GB RAM</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Container</span>
                    <span className={styles.val}>Docker Compose — Nginx · App · Kafka · ELK</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>Monitor</span>
                    <span className={styles.val}>Raspberry Pi 4 · ELK nginx access log pipeline</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.key}>CI/CD</span>
                    <span className={styles.val}>GitHub Actions</span>
                </div>
            </section>

            <div className={styles.divider} />

            {/* ── CONTACT ── */}
            <section className={styles.section}>
                <div className={styles.sectionTitle}>&gt; CONTACT</div>
                <div className={styles.line}>
                    <span className={styles.key}>GitHub</span>
                    <a
                        className={styles.link}
                        href="https://github.com/PasserbyMa"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        github.com/PasserbyMa
                    </a>
                </div>
            </section>
        </div>
    );
};

export default IntroModal;
