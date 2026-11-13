import java.io.File
import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.logging.LogLevel
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.TaskAction
import javax.inject.Inject
import org.gradle.process.ExecOperations

abstract class BuildTask : DefaultTask() {
    @get:Inject
    abstract val execOperations: ExecOperations

    @Input
    var rootDirRel: String? = null
    @Input
    var projectDir: String? = null
    @Input
    var target: String? = null
    @Input
    var release: Boolean? = null

    @TaskAction
    fun assemble() {
        val rootDirRel = rootDirRel ?: throw GradleException("rootDirRel cannot be null")
        val projectDir = projectDir ?: throw GradleException("projectDir cannot be null")
        val target = target ?: throw GradleException("target cannot be null")
        val isRelease = release ?: false

        val srcTauriDir = File(projectDir, rootDirRel).canonicalFile
        val cliOptionsFile = File(srcTauriDir, "gen/android/.tauri/cli-options-server.json")

        val (rustTarget, abiName) = when (target) {
            "aarch64" -> "aarch64-linux-android" to "arm64-v8a"
            "armv7" -> "armv7-linux-androideabi" to "armeabi-v7a"
            "i686" -> "i686-linux-android" to "x86"
            "x86_64" -> "x86_64-linux-android" to "x86_64"
            else -> "aarch64-linux-android" to "arm64-v8a"
        }

        val profileDir = if (isRelease) "release" else "debug"
        val soSource = File(srcTauriDir, "target/$rustTarget/$profileDir/libgestor_horarios_lib.so")
        val jniDestDir = File(projectDir, "src/main/jniLibs/$abiName")
        val soDest = File(jniDestDir, "libgestor_horarios_lib.so")

        if (cliOptionsFile.exists()) {
            val executable = """npm"""
            try {
                runTauriCli(executable)
            } catch (e: Exception) {
                if (Os.isFamily(Os.FAMILY_WINDOWS)) {
                    val fallbacks = listOf("$executable.exe", "$executable.cmd", "$executable.bat")
                    for (fallback in fallbacks) {
                        try {
                            runTauriCli(fallback)
                            break
                        } catch (_: Exception) {
                        }
                    }
                }
            }
        }

        if (soSource.exists()) {
            jniDestDir.mkdirs()
            soSource.copyTo(soDest, overwrite = true)
            logger.lifecycle("Copied ${soSource.absolutePath} -> ${soDest.absolutePath}")
        } else if (!soDest.exists()) {
            throw GradleException("Native library not found at ${soSource.absolutePath}")
        }
    }

    fun runTauriCli(executable: String) {
        val rootDirRel = rootDirRel ?: throw GradleException("rootDirRel cannot be null")
        val target = target ?: throw GradleException("target cannot be null")
        val release = release ?: throw GradleException("release cannot be null")
        val args = listOf("run", "--", "tauri", "android", "android-studio-script")

        execOperations.exec {
            workingDir(File(projectDir, rootDirRel))
            executable(executable)
            args(args)
            if (logger.isEnabled(LogLevel.DEBUG)) {
                args("-vv")
            } else if (logger.isEnabled(LogLevel.INFO)) {
                args("-v")
            }
            if (release) {
                args("--release")
            }
            args(listOf("--target", target))
        }.assertNormalExitValue()
    }
}
